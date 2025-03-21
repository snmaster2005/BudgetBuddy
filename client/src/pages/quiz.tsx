import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { QuizQuestion } from "@shared/schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Loader2, Check, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Quiz(): JSX.Element {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const [currentStep, setCurrentStep] = useState<"start" | "questions" | "results">("start");
  const [questions, setQuestions] = useState<Partial<QuizQuestion>[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizResults, setQuizResults] = useState<{
    correctAnswers: number;
    totalQuestions: number;
    passed: boolean;
    score: number;
    upiUnblocked: boolean;
  } | null>(null);
  
  // Start quiz query
  const startQuizMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/quiz/start", {
        difficulty: "medium",
        count: 5
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setQuestions(data.questions);
      setCurrentStep("questions");
      setAnswers(new Array(data.questions.length).fill(-1));
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to start quiz",
        description: error.message
      });
    }
  });
  
  // Submit quiz mutation
  const submitQuizMutation = useMutation({
    mutationFn: async (answers: number[]) => {
      const res = await apiRequest("POST", "/api/quiz/complete", { answers });
      return await res.json();
    },
    onSuccess: (data) => {
      setQuizResults(data);
      setCurrentStep("results");
      
      // Refetch user data if UPI was unblocked
      if (data.upiUnblocked) {
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      }
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to submit quiz",
        description: error.message
      });
    }
  });
  
  // Handle answer selection
  const selectAnswer = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answerIndex;
    setAnswers(newAnswers);
  };
  
  // Handle moving to the next question
  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Submit answers when we reach the end
      submitQuizMutation.mutate(answers);
    }
  };
  
  // Handle going to the previous question
  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  // Check if current question has been answered
  const isCurrentQuestionAnswered = () => {
    return answers[currentQuestionIndex] !== -1;
  };
  
  // Calculate progress percentage
  const progressPercentage = (currentQuestionIndex + 1) / questions.length * 100;
  
  // Render quiz start screen
  if (currentStep === "start") {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Financial Knowledge Quiz</CardTitle>
            <CardDescription>
              Complete this quiz to unblock UPI transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>
                Your UPI transactions have been blocked because you exceeded your budget
                in one or more categories. To unblock UPI, you need to demonstrate your
                understanding of basic financial concepts.
              </p>
              <p>
                This quiz contains {5} questions about budgeting, saving, and financial
                management. You need to answer at least 60% correctly to unblock UPI.
              </p>
              <Alert>
                <AlertTitle>Why is this happening?</AlertTitle>
                <AlertDescription>
                  Learning financial concepts helps build better spending habits. This feature 
                  is designed to promote financial literacy and responsible spending.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => startQuizMutation.mutate()}
              disabled={startQuizMutation.isPending}
              className="w-full"
            >
              {startQuizMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading Quiz
                </>
              ) : (
                "Start Quiz"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Render quiz questions
  if (currentStep === "questions" && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex];
    
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Card className="w-full">
          <CardHeader>
            <div className="flex justify-between items-center mb-2">
              <CardTitle className="text-xl">Question {currentQuestionIndex + 1} of {questions.length}</CardTitle>
              <span className="text-sm text-muted-foreground">
                Progress: {Math.round(progressPercentage)}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <h3 className="text-lg font-medium">{currentQuestion.question}</h3>
              <div className="space-y-3">
                {currentQuestion.options?.map((option, index) => (
                  <Button
                    key={index}
                    variant={answers[currentQuestionIndex] === index ? "default" : "outline"}
                    className="w-full justify-start text-left h-auto py-3 px-4"
                    onClick={() => selectAnswer(currentQuestionIndex, index)}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={goToPrevQuestion}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>
            <Button
              onClick={goToNextQuestion}
              disabled={!isCurrentQuestionAnswered() || submitQuizMutation.isPending}
            >
              {submitQuizMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting
                </>
              ) : currentQuestionIndex === questions.length - 1 ? (
                "Submit Quiz"
              ) : (
                "Next Question"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Render quiz results
  if (currentStep === "results" && quizResults) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Quiz Results</CardTitle>
            <CardDescription>
              {quizResults.passed
                ? "Congratulations! You've passed the quiz."
                : "Sorry, you didn't pass the quiz."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center py-4">
                {quizResults.passed ? (
                  <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <Check className="h-12 w-12 text-green-500" />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mb-4">
                    <X className="h-12 w-12 text-red-500" />
                  </div>
                )}
                <h3 className="text-2xl font-bold">
                  Score: {quizResults.score}%
                </h3>
                <p className="text-muted-foreground">
                  You got {quizResults.correctAnswers} out of {quizResults.totalQuestions} questions correct.
                </p>
              </div>

              <Alert variant={quizResults.upiUnblocked ? "default" : "destructive"}>
                <AlertTitle>
                  {quizResults.upiUnblocked
                    ? "UPI Transactions Unblocked"
                    : "UPI Transactions Still Blocked"}
                </AlertTitle>
                <AlertDescription>
                  {quizResults.upiUnblocked
                    ? "You can now use UPI for transactions. Remember to stay within your budget!"
                    : "You need to score at least 60% to unblock UPI transactions. Please try again."}
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            {!quizResults.passed && (
              <Button
                onClick={() => {
                  setCurrentStep("start");
                  setCurrentQuestionIndex(0);
                  setAnswers([]);
                }}
              >
                Try Again
              </Button>
            )}
            <Button
              onClick={() => navigate("/")}
              variant={quizResults.passed ? "default" : "outline"}
              className="ml-auto"
            >
              {quizResults.passed ? "Continue to Dashboard" : "Back to Dashboard"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // If we somehow reach here, show a loading state
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}