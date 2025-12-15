// Academy pages
import LearningPathPage from "../pages/academy/learning-path.js";
import CourseListPage from "../pages/academy/course-list.js";
import CourseDetailPage from "../pages/academy/course-detail.js";

// Auth pages
import LoginPage from "../pages/auth/login-page.js";
import RegisterPage from "../pages/auth/register-page.js";

// Other pages
import HomePage from "../pages/home/home-page.js";
import DashboardPage from "../pages/dashboard/dashboard-page.js";
import AssessmentPage from "../pages/assessment/assessment-page.js";
import AssessmentTest from "../pages/assessment/assessment-test.js";
import AssessmentResult from "../pages/assessment/assessment-result.js";
import AssessmentQuiz from "../pages/assessment/assessment-quiz.js";
import Recommendation from "../pages/assessment/recommendation.js";

export default {
  '/': new HomePage(),
  '/login': new LoginPage(),
  '/register': new RegisterPage(),
  '/dashboard': new DashboardPage(),
  '/assessment': new AssessmentPage(),
  '/assessment/test': new AssessmentTest(),
  '/assessment/result': new AssessmentResult(),
  '/assessment/quiz': new AssessmentQuiz(),
  '/assessment/recommendation': new Recommendation(),
  
  '/academy': LearningPathPage,
  '/academy/learning-path': LearningPathPage,
  '/academy/course-list': CourseListPage,
  '/academy/course-detail': CourseDetailPage,
};
