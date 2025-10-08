# Quizzes & Assessments System

## Overview

The PPR Academy Quiz System provides a comprehensive assessment platform supporting multiple question types, automated grading, timed assessments, and retake limits. Perfect for validating student learning and making courses interactive.

---

## Features

### ✅ Multiple Question Types
- **Multiple Choice**: Single correct answer with 2-6 options
- **True/False**: Binary questions
- **Fill in the Blank**: Text-based answers with multiple acceptable answers
- **Short Answer**: Brief text responses (manual grading)
- **Essay**: Long-form responses (manual grading)
- **Matching**: Match left items with right items

### ✅ Quiz Types
- **Practice Mode**: No time limit, unlimited attempts, immediate feedback
- **Assessment**: Graded quizzes with configurable settings
- **Final Exam**: Strict settings, limited attempts, required to pass

### ✅ Automated Grading
- Instant grading for multiple choice, true/false, fill-in-blank, matching
- Partial credit for matching questions
- Case-sensitive options for fill-in-blank
- Manual grading for essay/short answer

### ✅ Advanced Features
- Time limits (optional, per quiz)
- Retake limits (unlimited to N attempts)
- Passing score requirements
- Question and answer shuffling
- Show/hide correct answers
- Immediate vs delayed score reveal
- Question banks for reuse

---

## Database Schema

### 1. Quizzes Table

```typescript
{
  title: string,
  description?: string,
  courseId: Id<"courses">,
  chapterId?: string,                    // Optional: attach to chapter
  instructorId: string,
  
  quizType: "practice" | "assessment" | "final_exam",
  
  timeLimit?: number,                    // Minutes
  maxAttempts?: number,                  // null = unlimited
  
  passingScore: number,                  // 0-100 percentage
  requiredToPass: boolean,               // Block progress if failed
  
  totalPoints: number,                   // Calculated from questions
  showCorrectAnswers: boolean,
  showScoreImmediately: boolean,
  
  shuffleQuestions: boolean,
  shuffleAnswers: boolean,
  
  isPublished: boolean,
  availableFrom?: number,
  availableUntil?: number,
  
  createdAt: number,
  updatedAt: number,
}
```

### 2. Questions Table

```typescript
{
  quizId: Id<"quizzes">,
  
  questionType: "multiple_choice" | "true_false" | "fill_blank" | 
                "short_answer" | "essay" | "matching",
  
  questionText: string,
  questionImage?: string,                // Storage URL
  explanation?: string,                  // Shown after submission
  
  order: number,
  points: number,
  
  answers: any,                          // Structure varies by type
  
  caseSensitive?: boolean,               // For fill-in-blank
  partialCredit?: boolean,               // For matching
  
  createdAt: number,
  updatedAt: number,
}
```

**Answer Structures by Question Type:**

**Multiple Choice:**
```typescript
[
  { text: "Option A", isCorrect: false },
  { text: "Option B", isCorrect: true },
  { text: "Option C", isCorrect: false },
]
```

**True/False:**
```typescript
{ correctAnswer: true }
```

**Fill in the Blank:**
```typescript
["answer1", "answer2", "acceptable variant"]
```

**Matching:**
```typescript
[
  { left: "Item 1", right: "Match A" },
  { left: "Item 2", right: "Match B" },
]
```

### 3. Quiz Attempts Table

```typescript
{
  quizId: Id<"quizzes">,
  userId: string,
  courseId: Id<"courses">,
  
  attemptNumber: number,
  status: "in_progress" | "submitted" | "graded" | "expired",
  
  startedAt: number,
  submittedAt?: number,
  timeSpent?: number,                    // Seconds
  
  score?: number,                        // Points earned
  percentage?: number,                   // 0-100
  passed?: boolean,
  
  answers: [{
    questionId: Id<"questions">,
    answer: any,
    isCorrect?: boolean,
    pointsEarned?: number,
    gradedAt?: number,
    feedback?: string,                   // For manual grading
  }],
  
  createdAt: number,
  updatedAt: number,
}
```

### 4. Quiz Results Table

```typescript
{
  quizId: Id<"quizzes">,
  userId: string,
  courseId: Id<"courses">,
  
  bestAttemptId: Id<"quizAttempts">,
  bestScore: number,
  bestPercentage: number,
  
  totalAttempts: number,
  averageScore: number,
  averagePercentage: number,
  
  hasPassed: boolean,
  firstPassedAt?: number,
  
  isCompleted: boolean,
  completedAt?: number,
  
  createdAt: number,
  updatedAt: number,
}
```

### 5. Question Banks Table

```typescript
{
  title: string,
  description?: string,
  instructorId: string,
  courseId?: Id<"courses">,
  
  tags: string[],
  questionIds: Id<"questions">[],
  
  createdAt: number,
  updatedAt: number,
}
```

---

## API Functions

### Quiz Management

#### `createQuiz(args)`
Create a new quiz.

```typescript
const result = await createQuiz({
  title: "Module 1 Assessment",
  description: "Test your knowledge of Ableton basics",
  courseId: courseId,
  chapterId: "chapter-1",
  instructorId: user.id,
  quizType: "assessment",
  timeLimit: 30,                         // 30 minutes
  maxAttempts: 3,
  passingScore: 70,
  requiredToPass: true,
  showCorrectAnswers: true,
  showScoreImmediately: true,
  shuffleQuestions: true,
  shuffleAnswers: true,
});

// Returns: { success: true, quizId: "..." }
```

#### `addQuestion(args)`
Add a question to a quiz.

```typescript
// Multiple Choice Example
await addQuestion({
  quizId: quizId,
  questionType: "multiple_choice",
  questionText: "What is the default tempo in Ableton Live?",
  points: 10,
  answers: [
    { text: "100 BPM", isCorrect: false },
    { text: "120 BPM", isCorrect: true },
    { text: "128 BPM", isCorrect: false },
    { text: "140 BPM", isCorrect: false },
  ],
  explanation: "Ableton Live's default tempo is 120 BPM.",
});

// True/False Example
await addQuestion({
  quizId: quizId,
  questionType: "true_false",
  questionText: "MIDI clips can contain audio recordings.",
  points: 5,
  answers: { correctAnswer: false },
  explanation: "MIDI clips contain note data, not audio recordings.",
});

// Fill in the Blank Example
await addQuestion({
  quizId: quizId,
  questionType: "fill_blank",
  questionText: "The keyboard shortcut to duplicate a clip is ____.",
  points: 5,
  answers: ["Cmd+D", "Command+D", "Ctrl+D"],
  caseSensitive: false,
});
```

#### `publishQuiz(quizId)`
Publish a quiz to make it available to students.

```typescript
const result = await publishQuiz({ quizId: quizId });
// Returns: { success: true }
```

#### `getQuizWithQuestions(quizId)`
Get quiz details with all questions.

```typescript
const quiz = useQuery(api.quizzes.getQuizWithQuestions, { quizId });
// Returns: { ...quizData, questions: [...] }
```

#### `getQuizzesForCourse(courseId)`
Get all quizzes for a course.

```typescript
const quizzes = useQuery(api.quizzes.getQuizzesForCourse, {
  courseId: courseId,
  includeUnpublished: false,              // Only published
});
```

### Quiz Taking

#### `startQuizAttempt(args)`
Start a new quiz attempt.

```typescript
const result = await startQuizAttempt({
  quizId: quizId,
  userId: user.id,
  courseId: courseId,
});

// Returns: { success: true, attemptId: "..." }
// Or: { success: false, error: "Maximum attempts reached" }
```

#### `submitQuizAttempt(args)`
Submit quiz answers for grading.

```typescript
const result = await submitQuizAttempt({
  attemptId: attemptId,
  answers: [
    { questionId: q1Id, answer: "120 BPM" },
    { questionId: q2Id, answer: false },
    { questionId: q3Id, answer: "Cmd+D" },
  ],
});

// Returns: {
//   success: true,
//   score: 85,
//   percentage: 85,
//   passed: true
// }
```

### Results & Analytics

#### `getUserQuizResults(args)`
Get user's quiz results.

```typescript
// All quizzes
const allResults = useQuery(api.quizzes.getUserQuizResults, {
  userId: user.id
});

// Specific quiz
const quizResult = useQuery(api.quizzes.getUserQuizResults, {
  userId: user.id,
  quizId: quizId
});

// Course quizzes
const courseResults = useQuery(api.quizzes.getUserQuizResults, {
  userId: user.id,
  courseId: courseId
});
```

#### `getQuizAttempt(attemptId)`
Get details of a specific attempt.

```typescript
const attempt = useQuery(api.quizzes.getQuizAttempt, {
  attemptId: attemptId
});
```

---

## Automated Grading

### Grading Logic

The system automatically grades these question types:

**1. Multiple Choice**
- Compares student answer with correct option
- All or nothing scoring

**2. True/False**
- Direct boolean comparison
- All or nothing scoring

**3. Fill in the Blank**
- Checks against list of acceptable answers
- Case-sensitive option available
- All or nothing scoring

**4. Matching**
- Counts correct matches
- Supports partial credit
- Calculates percentage of correct matches

**5. Short Answer & Essay**
- Requires manual grading
- Initially marked with 0 points
- Instructor reviews and assigns score

### Grading Example

```typescript
// Student Answer: "Cmd+D"
// Acceptable Answers: ["Cmd+D", "Command+D", "Ctrl+D"]
// Case Sensitive: false

// Normalized comparison
const normalizedAnswer = "cmd+d";
const normalizedAcceptable = ["cmd+d", "command+d", "ctrl+d"];
const isCorrect = normalizedAcceptable.includes(normalizedAnswer);

// Result: ✅ Correct, full points awarded
```

---

## Quiz Taking Flow

### 1. Student Views Available Quizzes
```typescript
const quizzes = useQuery(api.quizzes.getQuizzesForCourse, {
  courseId: courseId
});

// Display list of quizzes with:
// - Title, description
// - Points, passing score
// - Time limit, max attempts
// - User's best score (if attempted)
```

### 2. Student Starts Quiz
```typescript
// Check if allowed to attempt
const results = useQuery(api.quizzes.getUserQuizResults, {
  userId: user.id,
  quizId: quizId
});

if (quiz.maxAttempts && results?.totalAttempts >= quiz.maxAttempts) {
  // Show "Maximum attempts reached"
  return;
}

// Start attempt
const { attemptId } = await startQuizAttempt({
  quizId: quizId,
  userId: user.id,
  courseId: courseId,
});

// Fetch questions
const quiz = useQuery(api.quizzes.getQuizWithQuestions, { quizId });

// Shuffle if configured
const questions = quiz.shuffleQuestions 
  ? shuffleArray(quiz.questions)
  : quiz.questions;
```

### 3. Student Answers Questions
```typescript
// Track answers in state
const [answers, setAnswers] = useState<Record<string, any>>({});

const handleAnswer = (questionId: string, answer: any) => {
  setAnswers(prev => ({
    ...prev,
    [questionId]: answer
  }));
};

// Show timer if time limit exists
if (quiz.timeLimit) {
  const endTime = attemptStartTime + (quiz.timeLimit * 60 * 1000);
  // Display countdown timer
  // Auto-submit when time expires
}
```

### 4. Student Submits Quiz
```typescript
const result = await submitQuizAttempt({
  attemptId: attemptId,
  answers: Object.entries(answers).map(([questionId, answer]) => ({
    questionId: questionId as Id<"questions">,
    answer: answer
  }))
});

if (result.success) {
  // Show results
  console.log(`Score: ${result.score}/${quiz.totalPoints}`);
  console.log(`Percentage: ${result.percentage}%`);
  console.log(`Status: ${result.passed ? 'PASSED' : 'FAILED'}`);
  
  if (quiz.showCorrectAnswers) {
    // Show correct answers and explanations
  }
}
```

---

## Instructor Features

### Quiz Builder Workflow

**1. Create Quiz**
```typescript
const { quizId } = await createQuiz({
  title: "Final Exam",
  courseId: courseId,
  quizType: "final_exam",
  timeLimit: 60,
  maxAttempts: 2,
  passingScore: 75,
  requiredToPass: true,
  showCorrectAnswers: false,              // Don't show until all attempts used
  showScoreImmediately: true,
  shuffleQuestions: true,
  shuffleAnswers: true,
});
```

**2. Add Questions**
```typescript
// Add 10 questions
for (const q of questions) {
  await addQuestion({
    quizId: quizId,
    questionType: q.type,
    questionText: q.text,
    points: q.points,
    answers: q.answers,
  });
}
```

**3. Review & Publish**
```typescript
// Preview quiz
const quiz = await getQuizWithQuestions({ quizId });

// Publish when ready
await publishQuiz({ quizId });
```

### Question Bank Usage

**Create Bank:**
```typescript
const bankId = await createQuestionBank({
  title: "Ableton Basics Questions",
  instructorId: user.id,
  courseId: courseId,
  tags: ["ableton", "daw", "basics"],
  questionIds: [q1Id, q2Id, q3Id],
});
```

**Reuse Questions:**
```typescript
// Fetch bank
const bank = await getQuestionBank({ bankId });

// Add questions to new quiz
for (const questionId of bank.questionIds) {
  // Clone question to new quiz
  await duplicateQuestion({ questionId, newQuizId });
}
```

---

## Security & Validation

### Prevent Cheating

**1. Time Limits**
- Server-side validation of submission time
- Auto-submit when time expires
- Cannot modify answers after time up

**2. Attempt Limits**
- Server-side check before starting attempt
- Cannot bypass with client-side manipulation

**3. Answer Shuffling**
- Questions shuffled per attempt
- Answers shuffled per question
- Different order for each student

**4. Answer Hiding**
- Configurable: show/hide correct answers
- Can delay until all attempts used
- Prevent students from sharing answers

### Validation

**Before Starting:**
- Quiz must be published
- Check max attempts not exceeded
- Check availability dates

**Before Submitting:**
- Verify attempt is "in_progress"
- Validate all answers provided
- Check time limit not exceeded

**After Submitting:**
- Automatic grading runs server-side
- Cannot manipulate scores client-side
- Results stored immutably

---

## Integration Examples

### Add Quiz to Course Chapter

```typescript
// In chapter content
<div>
  <h2>Chapter 1: Introduction</h2>
  <p>Course content...</p>
  
  {/* Quiz component */}
  <QuizSection chapterId="chapter-1" />
</div>
```

### Display Quiz Results in Dashboard

```typescript
const results = useQuery(api.quizzes.getUserQuizResults, {
  userId: user.id,
  courseId: courseId
});

return (
  <div>
    <h3>Your Quiz Results</h3>
    {results?.map(result => (
      <div key={result._id}>
        <h4>{result.quizTitle}</h4>
        <p>Best Score: {result.bestPercentage}%</p>
        <p>Attempts: {result.totalAttempts}</p>
        <p>Status: {result.hasPassed ? '✅ Passed' : '❌ Not Passed'}</p>
      </div>
    ))}
  </div>
);
```

### Block Progress Until Quiz Passed

```typescript
const quizResult = useQuery(api.quizzes.getUserQuizResults, {
  userId: user.id,
  quizId: quiz.id
});

if (quiz.requiredToPass && !quizResult?.hasPassed) {
  return (
    <div>
      <p>⚠️ You must pass the quiz to continue</p>
      <Button onClick={() => router.push(`/quiz/${quiz.id}`)}>
        Take Quiz
      </Button>
    </div>
  );
}

// Show next chapter
return <NextChapter />;
```

---

## Best Practices

### Quiz Design

**1. Question Types**
- Use multiple choice for factual knowledge
- Use true/false for concept verification
- Use fill-in-blank for terminology
- Use short answer for application
- Use essay for critical thinking

**2. Point Distribution**
- Easy questions: 5-10 points
- Medium questions: 10-15 points
- Hard questions: 15-20 points
- Total: 100 points for easy calculations

**3. Passing Score**
- Practice: 0% (just for learning)
- Assessment: 60-70%
- Final Exam: 75-80%

### Student Experience

**1. Feedback**
- Always provide explanations
- Show correct answers after submission
- Give helpful feedback for wrong answers

**2. Attempts**
- Practice: Unlimited
- Assessment: 2-3 attempts
- Final: 1-2 attempts

**3. Time Limits**
- Practice: No limit
- Assessment: 1-2 minutes per question
- Final: Strict time limit

---

## Future Enhancements

- [ ] Question randomization from banks
- [ ] Image upload for questions
- [ ] LaTeX math equation support
- [ ] Code syntax highlighting for coding questions
- [ ] Peer review for essay questions
- [ ] Plagiarism detection
- [ ] Quiz analytics for instructors
- [ ] Question difficulty analysis
- [ ] Adaptive quizzes (adjust difficulty)
- [ ] Certificate generation based on quiz scores

---

## Summary

The Quiz & Assessment System provides:

✅ **6 Question Types** (multiple choice, true/false, fill-blank, short answer, essay, matching)
✅ **3 Quiz Types** (practice, assessment, final exam)
✅ **Automated Grading** (instant for objective questions)
✅ **Timed Assessments** (optional time limits)
✅ **Retake Limits** (configurable max attempts)
✅ **Question Banks** (reuse questions across quizzes)
✅ **Shuffling** (questions and answers)
✅ **Results Tracking** (best score, averages, pass/fail)
✅ **Security** (server-side validation, time checks)

Perfect for creating interactive, engaging courses with validated learning outcomes! 🎓

