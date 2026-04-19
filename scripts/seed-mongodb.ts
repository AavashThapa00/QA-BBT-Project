import { config } from "dotenv";
import { randomBytes, randomUUID, scryptSync } from "crypto";
import { MongoClient } from "mongodb";

config({ path: ".env.local" });

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || "sheet-webapp";

if (!uri) {
  throw new Error("MONGODB_URI is required. Set it in .env.local");
}

const mongoUri = uri;

const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
};

type SeedCase = {
  sectionName: string;
  testCaseId: string;
  title: string;
  steps: string;
};

type SeedModule = {
  cycleName: string;
  moduleName: string;
  cases: SeedCase[];
};

type SeedSuite = {
  rootName: string;
  folderName: string;
  modules: SeedModule[];
};

const hsaSeedModules: SeedModule[] = [
  {
    cycleName: "Authentication",
    moduleName: "Authentication",
    cases: [
      {
        sectionName: "Registration",
        testCaseId: "RE001",
        title: "Registration - with valid details",
        steps:
          "Go to Registration page. Enter valid name, email, and password. Click Sign Up.",
      },
      {
        sectionName: "Registration",
        testCaseId: "RE002",
        title: "Registration - with an existing email",
        steps:
          "Go to Registration page. Enter an already registered email. Click Sign Up.",
      },
      {
        sectionName: "Registration",
        testCaseId: "RE003",
        title: "Registration - with invalid Name format",
        steps:
          "Go to Registration page. Enter invalid name format (Aavash 69). Fill valid password. Click Sign Up.",
      },
      {
        sectionName: "Registration",
        testCaseId: "RE004",
        title: "Registration - with invalid email format",
        steps:
          "Go to Registration page. Enter invalid email format. Fill valid password. Click Sign Up.",
      },
      {
        sectionName: "Registration",
        testCaseId: "RE005",
        title: "Registration - with weak password",
        steps:
          "Enter valid name and email. Enter a short password. Click Sign Up.",
      },
      {
        sectionName: "Registration",
        testCaseId: "RE006",
        title: "Registration - with blank mandatory fields",
        steps: "Leave one or more mandatory fields empty. Click Sign Up.",
      },
      {
        sectionName: "Registration",
        testCaseId: "RE007",
        title: "Registration - with no internet connection",
        steps: "Disconnect internet. Fill valid details. Click Sign Up.",
      },
      {
        sectionName: "Registration",
        testCaseId: "RE008",
        title:
          "Registration - Verify redirection after successful registration",
        steps:
          "Go to registration page. Enter valid details. Click Sign Up. Verify redirect behavior.",
      },
      {
        sectionName: "Registration",
        testCaseId: "RE009",
        title:
          "Registration - Verify navigation inconsistency between login and register buttons",
        steps:
          "Click Login button in navbar. Click Register for Free under login/register section.",
      },
      {
        sectionName: "Registration",
        testCaseId: "RE010",
        title:
          "Registration - Verify registration with leading/trailing spaces in input fields",
        steps: "Enter spaces before/after name and email. Click Sign Up.",
      },
      {
        sectionName: "Registration",
        testCaseId: "RE011",
        title: "Registration - Verify case sensitivity of email address",
        steps: "Enter same email with different cases. Submit form.",
      },
      {
        sectionName: "Registration",
        testCaseId: "RE012",
        title: "Registration - with special characters in name field",
        steps: "Enter name with symbols or numbers. Click Register.",
      },
      {
        sectionName: "Registration",
        testCaseId: "RE013",
        title: "Registration - Verify the email verification",
        steps: "Register with new email. Open mailbox. Click Verify Email.",
      },
      {
        sectionName: "Registration",
        testCaseId: "RE014",
        title: "Registration - from app",
        steps: "Go to registration page in app. Enter details. Click Sign Up.",
      },
      {
        sectionName: "Forget Password",
        testCaseId: "FP001",
        title: "Forgot Password link is visible and clickable",
        steps: "Go to Login page. Verify Forgot Password link. Click it.",
      },
      {
        sectionName: "Forget Password",
        testCaseId: "FP002",
        title: "Reset with registered email",
        steps:
          "Click Forgot Password. Enter registered email. Click Submit/Reset.",
      },
      {
        sectionName: "Forget Password",
        testCaseId: "FP003",
        title: "Reset with unregistered email",
        steps:
          "Click Forgot Password. Enter unregistered email. Click Submit/Reset.",
      },
      {
        sectionName: "Forget Password",
        testCaseId: "FP004",
        title: "Reset with invalid email format",
        steps:
          "Click Forgot Password. Enter invalid email. Click Submit/Reset.",
      },
      {
        sectionName: "Forget Password",
        testCaseId: "FP005",
        title: "Reset with blank email field",
        steps: "Click Forgot Password. Leave email blank. Click Submit/Reset.",
      },
      {
        sectionName: "Forget Password",
        testCaseId: "FP006",
        title: "Reset email link redirection",
        steps:
          "Open inbox. Click reset link. Verify redirect to reset password page.",
      },
      {
        sectionName: "Forget Password",
        testCaseId: "FP007",
        title: "Password reset form submission",
        steps: "On reset page enter new password and confirm. Click Submit.",
      },
      {
        sectionName: "Forget Password",
        testCaseId: "FP008",
        title: "Older reset link behavior",
        steps:
          "Use previously received reset link after latest reset. Verify behavior.",
      },
      {
        sectionName: "Forget Password",
        testCaseId: "FP009",
        title: "No internet during reset",
        steps: "Disconnect internet. Enter valid email. Click Submit/Reset.",
      },
      {
        sectionName: "Login",
        testCaseId: "LG001",
        title: "Login with valid credentials",
        steps:
          "Navigate to login page. Enter valid credentials. Click Login. Observe post-login behavior.",
      },
      {
        sectionName: "Login",
        testCaseId: "LG002",
        title: "Invalid password",
        steps:
          "Go to login page. Enter valid email and invalid password. Click Login.",
      },
      {
        sectionName: "Login",
        testCaseId: "LG003",
        title: "Unregistered email",
        steps:
          "Go to login page. Enter email not present in system. Click Login.",
      },
      {
        sectionName: "Login",
        testCaseId: "LG004",
        title: "Blank fields",
        steps: "Go to login page. Leave email and password blank. Click Login.",
      },
      {
        sectionName: "Login",
        testCaseId: "LG005",
        title: "Invalid email format",
        steps: "Go to login page. Enter invalid email format. Click Login.",
      },
      {
        sectionName: "Login",
        testCaseId: "LG006",
        title: "Login attempt with unactivated account",
        steps:
          "Go to login page. Enter credentials of unactivated account. Click Login.",
      },
      {
        sectionName: "Login",
        testCaseId: "LG007",
        title: "Network failure during login",
        steps: "Disconnect internet. Enter valid credentials. Click Login.",
      },
      {
        sectionName: "Login",
        testCaseId: "LG008",
        title: "Case sensitivity check for email",
        steps:
          "Enter registered email in different cases with correct password. Click Login.",
      },
      {
        sectionName: "Login",
        testCaseId: "LG009",
        title: "Multiple failed attempts",
        steps: "Repeat login attempts 3-5 times with wrong password.",
      },
      {
        sectionName: "Login",
        testCaseId: "LG010",
        title: "Session persistence across browser tabs",
        steps:
          "Login in one tab. Open app in another tab. Verify session state.",
      },
    ],
  },
  {
    cycleName: "Dashboard",
    moduleName: "Dashboard",
    cases: [
      {
        sectionName: "Dashboard (HomeSchool.asia)",
        testCaseId: "DB001",
        title: "Verify dashboard page load",
        steps: "Open platform and access dashboard.",
      },
      {
        sectionName: "Dashboard (HomeSchool.asia)",
        testCaseId: "DB002",
        title: "Verify dashboard loads successfully upon login",
        steps: "Login with valid credentials and navigate to dashboard.",
      },
      {
        sectionName: "Dashboard (HomeSchool.asia)",
        testCaseId: "DB003",
        title: "Verify all subject links under What are you preparing for?",
        steps: "Click each subject link/button on dashboard.",
      },
      {
        sectionName: "Dashboard (HomeSchool.asia)",
        testCaseId: "DB004",
        title: "Registration form field behavior after reopen",
        steps:
          "Open register form, fill fields, close, reopen, verify behavior.",
      },
      {
        sectionName: "Dashboard (HomeSchool.asia)",
        testCaseId: "DB005",
        title: "Verify videos and Learning Hub content",
        steps:
          "Open Explore more CAIE resources section and verify videos/content.",
      },
      {
        sectionName: "Dashboard (HomeSchool.asia)",
        testCaseId: "DB006",
        title: "Verify Connect with Tutor button",
        steps: "Click Connect with Tutor.",
      },
      {
        sectionName: "Dashboard (HomeSchool.asia)",
        testCaseId: "DB007",
        title: "Verify Revision Notes card",
        steps: "Click Revision Notes card.",
      },
      {
        sectionName: "Dashboard (HomeSchool.asia)",
        testCaseId: "DB008",
        title: "Verify Mock Exams card",
        steps: "Click Mock Exams card.",
      },
      {
        sectionName: "Dashboard (HomeSchool.asia)",
        testCaseId: "DB009",
        title: "Verify Ask Tutor card",
        steps: "Click Ask Tutor card.",
      },
      {
        sectionName: "Dashboard (HomeSchool.asia)",
        testCaseId: "DB010",
        title: "Verify Past Papers card",
        steps: "Click Past Papers card.",
      },
      {
        sectionName: "Dashboard (HomeSchool.asia)",
        testCaseId: "DB011",
        title: "Verify page load time",
        steps: "Load homepage on normal network and measure load time.",
      },
      {
        sectionName: "Dashboard (app.HomeSchool.asia)",
        testCaseId: "A_DB001",
        title: "Dashboard loads on app login",
        steps: "Login and navigate to app dashboard.",
      },
      {
        sectionName: "Dashboard (app.HomeSchool.asia)",
        testCaseId: "A_DB002",
        title: "Customise button functionality",
        steps: "Click Customise in Learning Resources.",
      },
      {
        sectionName: "Dashboard (app.HomeSchool.asia)",
        testCaseId: "A_DB003",
        title: "Unlock Answer button functionality",
        steps: "Click Unlock Answer under Get One Answer a Day.",
      },
      {
        sectionName: "Dashboard (app.HomeSchool.asia)",
        testCaseId: "A_DB004",
        title: "Get Support redirection",
        steps: "Click Get Support under Academic Support and verify redirect.",
      },
      {
        sectionName: "Dashboard (app.HomeSchool.asia)",
        testCaseId: "A_DB005",
        title: "Learn more button behavior",
        steps: "Click Learn more in Tips & Test section.",
      },
      {
        sectionName: "Dashboard (app.HomeSchool.asia)",
        testCaseId: "A_DB006",
        title: "Test Yourself functionality",
        steps: "Click Test Yourself in Competency Evaluator.",
      },
      {
        sectionName: "Dashboard (app.HomeSchool.asia)",
        testCaseId: "A_DB007",
        title: "Video thumbnails load and redirect",
        steps: "Open Next Videos to Watch and click any thumbnail.",
      },
      {
        sectionName: "Dashboard (app.HomeSchool.asia)",
        testCaseId: "A_DB008",
        title: "Badge text verification",
        steps: "Hover mastery status icons and verify badge text.",
      },
      {
        sectionName: "Dashboard (app.HomeSchool.asia)",
        testCaseId: "A_DB009",
        title: "Dashboard access without login",
        steps: "Copy dashboard URL, logout, open URL, verify access control.",
      },
      {
        sectionName: "Dashboard (app.HomeSchool.asia)",
        testCaseId: "A_DB010",
        title: "Behavior after session/token expiry",
        steps: "Keep dashboard open for 30+ minutes and interact.",
      },
      {
        sectionName: "Dashboard (app.HomeSchool.asia)",
        testCaseId: "A_DB011",
        title: "Learning Hub logout sync",
        steps:
          "Login to web, open Learning Hub, logout web, re-open Learning Hub.",
      },
      {
        sectionName: "Dashboard (app.HomeSchool.asia)",
        testCaseId: "A_DB012",
        title: "Customization persists after refresh",
        steps: "Hide a subject via Customise, save, refresh page.",
      },
      {
        sectionName: "Dashboard (app.HomeSchool.asia)",
        testCaseId: "A_DB013",
        title: "Network disconnect actions",
        steps: "Disconnect internet on dashboard and click View Reports.",
      },
    ],
  },
  {
    cycleName: "Profile",
    moduleName: "Profile",
    cases: [
      {
        sectionName: "Student Profile",
        testCaseId: "PR_01",
        title: "Login as Student",
        steps: "Login as student and verify dashboard loads properly.",
      },
      {
        sectionName: "Student Profile",
        testCaseId: "PR_02",
        title: "Student update Profile",
        steps:
          "Open My Profile, edit full name/country, save, verify reflected across app.",
      },
      {
        sectionName: "Student Profile",
        testCaseId: "PR_03",
        title: "Upload/Remove Profile Picture",
        steps:
          "Upload valid image, validate formats/sizes, save and remove with confirmation.",
      },
      {
        sectionName: "Student Profile",
        testCaseId: "PR_04",
        title: "Student Change Password",
        steps:
          "Open change password page, submit new password, logout/login with new password.",
      },
      {
        sectionName: "Student Profile",
        testCaseId: "PR_05",
        title: "Student Change email",
        steps:
          "Open change email page, enter new email and current password, verify email.",
      },
      {
        sectionName: "Student Profile",
        testCaseId: "PR_06",
        title: "Invalid password validation",
        steps:
          "Attempt password update with invalid password and verify validation message.",
      },
      {
        sectionName: "Student Profile",
        testCaseId: "PR_07",
        title: "Credits page",
        steps:
          "Open credits page, verify remarks/date/tutor credits and color coding.",
      },
      {
        sectionName: "Student Profile",
        testCaseId: "PR_08",
        title: "Buy Tutor credit",
        steps: "Open payment popup and verify tutor credit purchase flow.",
      },
      {
        sectionName: "Student Profile",
        testCaseId: "PR_09",
        title: "Manage subscription page",
        steps: "Verify subscription details: subject, plan, date, status.",
      },
      {
        sectionName: "Content Expert",
        testCaseId: "PR_09",
        title: "Login as Content expert",
        steps:
          "Login as content expert and verify dashboard and credentials flow.",
      },
      {
        sectionName: "Content Expert",
        testCaseId: "PR_10",
        title: "Content expert update profile",
        steps:
          "Open My Profile, edit full name, save; verify disabled fields remain disabled.",
      },
      {
        sectionName: "Content Expert",
        testCaseId: "PR_11",
        title: "Content expert upload/remove profile picture",
        steps: "Upload image, save, remove with warning and verify result.",
      },
      {
        sectionName: "Content Expert",
        testCaseId: "PR_12",
        title: "Content expert change password",
        steps: "Change password and verify login works with updated password.",
      },
    ],
  },
  {
    cycleName: "Instant Explanations",
    moduleName: "Instant Explanations",
    cases: [
      {
        sectionName: "Revision Notes",
        testCaseId: "IE001",
        title: "IE Access with 80%+ score",
        steps: "Attempt ELQ with IE available, score >=80%, submit, open IE.",
      },
      {
        sectionName: "Revision Notes",
        testCaseId: "IE005",
        title: "IE content display with LaTeX",
        steps: "Review equations and math rendering in IE content.",
      },
      {
        sectionName: "Revision Notes",
        testCaseId: "IE006",
        title: "IE download when access granted",
        steps: "Open IE and click Download IE.",
      },
      {
        sectionName: "Revision Notes",
        testCaseId: "IE007",
        title: "IE PDF content and formatting",
        steps: "Open downloaded PDF and verify completeness and formatting.",
      },
      {
        sectionName: "Revision Notes",
        testCaseId: "IE008",
        title: "Academic support redirection from IE",
        steps:
          "Open IE and click Academic Support; verify subject-specific redirect.",
      },
      {
        sectionName: "Revision Notes",
        testCaseId: "IE003",
        title: "IE availability message for unsupported content",
        steps: "Attempt ELQ where IE is unavailable and verify message.",
      },
      {
        sectionName: "Revision Notes",
        testCaseId: "IE002",
        title: "IE not accessible below 80%",
        steps: "Attempt ELQ with score <80% and verify access blocked.",
      },
      {
        sectionName: "Revision Notes",
        testCaseId: "IE009",
        title: "Repeat across all subjects",
        steps:
          "Repeat IE checks for Maths, Physics, Biology, Chemistry, Economics, Accounting.",
      },
    ],
  },
  {
    cycleName: "LR-IVY",
    moduleName: "LR-IVY",
    cases: [
      {
        sectionName: "Interactive Videos",
        testCaseId: "IVY001",
        title: "Dashboard components access",
        steps:
          "Verify Learning Resources/Get help/Tips and Test components are visible.",
      },
      {
        sectionName: "Interactive Videos",
        testCaseId: "IVY002",
        title: "Customize learning resources",
        steps:
          "Open customize popup, select subjects, save, verify toast and visibility.",
      },
      {
        sectionName: "Interactive Videos",
        testCaseId: "IVY003",
        title: "Redirect to respective chapter",
        steps: "Click subject chapter and verify chapter redirection.",
      },
      {
        sectionName: "Interactive Videos",
        testCaseId: "IVY004",
        title: "Switch subjects from dropdown",
        steps: "Change subject and verify chapter/video lists and order.",
      },
      {
        sectionName: "Interactive Videos",
        testCaseId: "IVY005",
        title: "Mark/unmark videos as important",
        steps: "Click star icon and verify toast feedback.",
      },
      {
        sectionName: "Interactive Videos",
        testCaseId: "IVY006",
        title: "Search videos across chapters",
        steps:
          "Search valid/invalid names and verify results or no-result toast.",
      },
      {
        sectionName: "Interactive Videos",
        testCaseId: "IVY007",
        title: "Important videos page",
        steps:
          "Open important videos page and verify listing/search/switch/unmark.",
      },
      {
        sectionName: "Interactive Videos",
        testCaseId: "IVY008",
        title: "Freemium subject behavior",
        steps:
          "Verify locked videos disabled with crown and free videos enabled.",
      },
      {
        sectionName: "Interactive Videos",
        testCaseId: "IVY009",
        title: "Unlocked videos are watchable",
        steps:
          "Open unlocked video and verify navigation and thumbnail/play button.",
      },
      {
        sectionName: "Interactive Videos",
        testCaseId: "IVY010",
        title: "Player functionality",
        steps: "Verify all core player controls and behavior.",
      },
      {
        sectionName: "Interactive Videos",
        testCaseId: "IVY011",
        title: "Video completion percentage",
        steps:
          "Watch partial video, refresh, verify completion and resume point.",
      },
      {
        sectionName: "Interactive Videos",
        testCaseId: "IVY012",
        title: "ELQ attempt flow",
        steps: "Attempt ELQ, submit, verify report/mastery/view count updates.",
      },
      {
        sectionName: "Interactive Videos",
        testCaseId: "IVY013",
        title: "Related videos sequence",
        steps: "Verify related videos show two before and two after current.",
      },
      {
        sectionName: "Interactive Videos",
        testCaseId: "IVY014",
        title: "Generate testpaper and revision note buttons",
        steps: "Verify both buttons navigate to correct pages.",
      },
      {
        sectionName: "Interactive Videos",
        testCaseId: "IVY015",
        title: "Mark important from individual video page",
        steps: "Use star icon and verify mark/unmark behavior.",
      },
      {
        sectionName: "Interactive Videos",
        testCaseId: "IVY016",
        title: "Chapter completion/mastery percentages",
        steps: "Verify chapter percentages and per-video metrics are correct.",
      },
      {
        sectionName: "Interactive Videos",
        testCaseId: "IVY017",
        title: "Subject completion/mastery percentages",
        steps: "Verify subject-level percentages in learning resources.",
      },
      {
        sectionName: "Interactive Videos",
        testCaseId: "IVY018",
        title: "Home badge correctness",
        steps:
          "Validate badge and completion reflect subject mastery on home page.",
      },
      {
        sectionName: "Interactive Videos",
        testCaseId: "IVY019",
        title: "Recently watched chapter display",
        steps: "Verify recently watched chapter appears and is clickable.",
      },
      {
        sectionName: "Interactive Videos",
        testCaseId: "IVY020",
        title: "Video/chapter counts",
        steps:
          "Verify attempted testpapers/videos watched/chapters completed counts.",
      },
      {
        sectionName: "Interactive Videos",
        testCaseId: "IVY021",
        title: "View Report button",
        steps: "Click View Report and verify navigation to subject report.",
      },
      {
        sectionName: "Interactive Videos",
        testCaseId: "IVY022",
        title: "Revision Note button",
        steps: "Click Revision Note and verify page redirect.",
      },
      {
        sectionName: "Interactive Videos",
        testCaseId: "IVY023",
        title: "Navigation to subject report page",
        steps: "Open report from subject page and verify subject switching.",
      },
      {
        sectionName: "Interactive Videos",
        testCaseId: "IVY024",
        title: "Overview section counts",
        steps: "Validate total videos/viewed/completed/mastered counts.",
      },
      {
        sectionName: "Interactive Videos",
        testCaseId: "IVY025",
        title: "My Completion/My Mastery correctness",
        steps: "Compare percentages with learning resources subject page.",
      },
      {
        sectionName: "Interactive Videos",
        testCaseId: "IVY026",
        title: "Recent Reports section",
        steps: "Verify recent reports list, color coding, and open behavior.",
      },
      {
        sectionName: "Interactive Videos",
        testCaseId: "IVY027",
        title: "Chapter-wise report access",
        steps: "Access chapter report list and verify search works.",
      },
      {
        sectionName: "Interactive Videos",
        testCaseId: "IVY028",
        title: "Locked content access behavior",
        steps:
          "Open locked video, verify premium message and allowed resources.",
      },
    ],
  },
  {
    cycleName: "Test paper",
    moduleName: "Test paper",
    cases: [
      {
        sectionName: "Testpaper",
        testCaseId: "TP001",
        title: "Student opens Testpaper tab",
        steps:
          "Open testpaper tab and verify generate option/list/count/no-data message.",
      },
      {
        sectionName: "Testpaper",
        testCaseId: "TP002",
        title: "All testpaper/all subjects dropdown",
        steps:
          "Use filters and verify generated testpapers are filtered correctly.",
      },
      {
        sectionName: "Testpaper",
        testCaseId: "TP003",
        title: "Search testpaper",
        steps: "Search testpaper and verify matching/no-results behavior.",
      },
      {
        sectionName: "Testpaper",
        testCaseId: "TP004(a)",
        title: "Generate Objective Testpaper",
        steps:
          "Generate objective testpaper and validate edit/replace/delete flow.",
      },
      {
        sectionName: "Testpaper",
        testCaseId: "TP004(b)",
        title: "Attempt Objective Testpaper",
        steps:
          "Attempt, submit, confirm, view details, and verify scoring/result status.",
      },
      {
        sectionName: "Testpaper",
        testCaseId: "TP005",
        title: "Hover options for objective testpaper",
        steps:
          "Hover testpaper and verify Attempt/Edit/History/Delete options.",
      },
      {
        sectionName: "Testpaper",
        testCaseId: "TP006",
        title: "Edit Testpaper in draft mode",
        steps: "Edit draft testpaper and verify updates persist.",
      },
      {
        sectionName: "Testpaper",
        testCaseId: "TP007",
        title: "Delete testpaper",
        steps: "Delete testpaper and verify it no longer appears in list.",
      },
      {
        sectionName: "Testpaper",
        testCaseId: "TP008(a)",
        title: "Create Subjective Testpaper",
        steps:
          "Generate subjective testpaper and validate edit/replace/delete flow.",
      },
      {
        sectionName: "Testpaper",
        testCaseId: "TP008(b)",
        title: "View Subjective Testpaper",
        steps:
          "Open subjective testpaper, verify marking scheme and PDF downloads.",
      },
      {
        sectionName: "Competency TestPaper",
        testCaseId: "TP010",
        title: "Open Competency tab",
        steps:
          "Open competency testpaper tab and verify attempt/listing behavior.",
      },
      {
        sectionName: "Competency TestPaper",
        testCaseId: "TP011",
        title: "All subjects dropdown in competency tab",
        steps: "Use subject/chapter dropdowns and verify data filtering.",
      },
      {
        sectionName: "Competency TestPaper",
        testCaseId: "TP012",
        title: "Search in competency testpaper",
        steps: "Search testpapers and verify correct results.",
      },
      {
        sectionName: "Competency TestPaper",
        testCaseId: "TP013",
        title: "Attempt pre/post competency test",
        steps: "Attempt pre/post test and verify completed report details.",
      },
    ],
  },
  {
    cycleName: "Revision Notes",
    moduleName: "Revision Notes",
    cases: [
      {
        sectionName: "Revision Notes (Logged in Premium Users)",
        testCaseId: "RN001",
        title: "Revision Notes from navigation",
        steps: "Click Revision Notes from navigation bar.",
      },
      {
        sectionName: "Revision Notes (Logged in Premium Users)",
        testCaseId: "RN002",
        title: "Download feature in web",
        steps: "Open IGCSE Biology topic and click Download.",
      },
      {
        sectionName: "Revision Notes (Logged in Premium Users)",
        testCaseId: "RN003",
        title: "Watch Videos in web",
        steps: "Open IGCSE Biology topic and click Watch Videos.",
      },
      {
        sectionName: "Revision Notes (Logged in Premium Users)",
        testCaseId: "RN004",
        title: "Watch Videos with alternate app subject",
        steps:
          "Set alternate subject in app and verify watch videos redirect in web.",
      },
      {
        sectionName: "Revision Notes (Logged in Premium Users)",
        testCaseId: "RN005",
        title: "A-level content mapping",
        steps: "Open A-level revision note and verify chapter-content mapping.",
      },
      {
        sectionName: "Revision Notes (Logged in Premium Users)",
        testCaseId: "RN006",
        title: "IGCSE content mapping",
        steps: "Open IGCSE revision note and verify chapter-content mapping.",
      },
      {
        sectionName: "Revision Notes (Logged in Premium Users)",
        testCaseId: "RN007",
        title: "A-level logged out restriction",
        steps:
          "Verify logged-out behavior and one-topic limitation for A-level.",
      },
      {
        sectionName: "Revision Notes (Logged in Premium Users)",
        testCaseId: "RN008",
        title: "IGCSE logged out restriction",
        steps: "Verify logged-out behavior and one-topic limitation for IGCSE.",
      },
      {
        sectionName: "Revision Notes (Logged in Premium Users)",
        testCaseId: "RN009",
        title: "Chapter/topic numbering sync",
        steps: "Verify chapter and topic numbering sync.",
      },
      {
        sectionName: "Revision Notes (Logged in Premium Users)",
        testCaseId: "RN010",
        title: "Content ingestion verification",
        steps: "Explore A-level notes and verify ingested content.",
      },
      {
        sectionName: "Revision Notes (Logged in Fremium Users)",
        testCaseId: "RN0010",
        title: "Fremium: navigation access",
        steps: "Click Revision Notes from navigation.",
      },
      {
        sectionName: "Revision Notes (Logged in Fremium Users)",
        testCaseId: "RN0011",
        title: "Fremium: download restriction",
        steps:
          "Open topic and click Download; verify premium requirement message.",
      },
      {
        sectionName: "Revision Notes (Logged in Fremium Users)",
        testCaseId: "RN0012",
        title: "Fremium: watch videos unlocked",
        steps: "Open unlocked topic and click Watch Videos.",
      },
      {
        sectionName: "Revision Notes (Logged in Fremium Users)",
        testCaseId: "RN0013",
        title: "Fremium: watch videos locked",
        steps: "Open locked topic and click Watch Videos.",
      },
      {
        sectionName: "Revision Notes (Logged in Fremium Users)",
        testCaseId: "RN0014",
        title: "Fremium A-level content mapping",
        steps: "Open A-level note and verify mapping.",
      },
      {
        sectionName: "Revision Notes (Logged in Fremium Users)",
        testCaseId: "RN0015",
        title: "Fremium IGCSE content mapping",
        steps: "Open IGCSE note and verify mapping.",
      },
      {
        sectionName: "Revision Notes (Logged in Fremium Users)",
        testCaseId: "RN0016",
        title: "Fremium A-level logged-out behavior",
        steps: "Verify logged-out access restrictions for A-level.",
      },
      {
        sectionName: "Revision Notes (Logged in Fremium Users)",
        testCaseId: "RN0017",
        title: "Fremium IGCSE logged-out behavior",
        steps: "Verify logged-out access restrictions for IGCSE.",
      },
      {
        sectionName: "Revision Notes (Logged in Fremium Users)",
        testCaseId: "RN0018",
        title: "Fremium numbering sync",
        steps: "Verify chapter/topic numbering sync.",
      },
      {
        sectionName: "Revision Notes (Logged in Fremium Users)",
        testCaseId: "RN0019",
        title: "Fremium content ingestion",
        steps: "Explore A-level notes and verify content ingestion.",
      },
      {
        sectionName: "Revision Notes (App)",
        testCaseId: "RN020",
        title: "App revision notes access",
        steps: "Open revision notes from any subject in app.",
      },
      {
        sectionName: "Revision Notes (App)",
        testCaseId: "RN021",
        title: "App download feature",
        steps: "Open topic and click Download.",
      },
      {
        sectionName: "Revision Notes (App)",
        testCaseId: "RN022",
        title: "App watch videos feature",
        steps: "Open topic and click Watch Videos.",
      },
      {
        sectionName: "Revision Notes (App)",
        testCaseId: "RN023",
        title: "App A-level content mapping",
        steps: "Open A-level note and verify mapping.",
      },
      {
        sectionName: "Revision Notes (App)",
        testCaseId: "RN024",
        title: "App IGCSE content mapping",
        steps: "Open IGCSE note and verify mapping.",
      },
      {
        sectionName: "Revision Notes (App)",
        testCaseId: "RN025",
        title: "App A-level logged-out behavior",
        steps: "Verify logged-out access restrictions for A-level.",
      },
      {
        sectionName: "Revision Notes (App)",
        testCaseId: "RN026",
        title: "App IGCSE logged-out behavior",
        steps: "Verify logged-out access restrictions for IGCSE.",
      },
      {
        sectionName: "Revision Notes (App)",
        testCaseId: "RN027",
        title: "App numbering sync",
        steps: "Verify chapter/topic numbering sync.",
      },
      {
        sectionName: "Revision Notes (App)",
        testCaseId: "RN028",
        title: "App content ingestion",
        steps: "Explore A-level notes and verify content ingestion.",
      },
      {
        sectionName: "Revision Notes (App)",
        testCaseId: "RN029",
        title: "App content with zoom changes",
        steps: "Zoom in/out while viewing notes and verify rendering.",
      },
    ],
  },
  {
    cycleName: "Academic Support",
    moduleName: "Academic Support",
    cases: [
      {
        sectionName: "STUDENT AND CONTENT EXPERT",
        testCaseId: "TC_AU_01",
        title: "Redirection to academic support",
        steps:
          "Student clicks Get Support and CE verifies All Query redirection.",
      },
      {
        sectionName: "STUDENT AND CONTENT EXPERT",
        testCaseId: "TC_AU_02",
        title: "Ticket enters Open status",
        steps:
          "Student submits question/feedback with valid fields and attachments; verify open status and listing.",
      },
      {
        sectionName: "STUDENT AND CONTENT EXPERT",
        testCaseId: "TC_AU_03",
        title: "Add tutor credit moves to Approval Pending",
        steps:
          "CE adds tutor credit on open ticket and approves; verify status transition.",
      },
      {
        sectionName: "STUDENT AND CONTENT EXPERT",
        testCaseId: "TC_AU_04",
        title: "Student approval moves to Ongoing",
        steps:
          "Student approves tutor credit from list/detail page; verify ongoing status.",
      },
      {
        sectionName: "STUDENT AND CONTENT EXPERT",
        testCaseId: "TC_AU_05",
        title: "CE answer moves ticket to Answered",
        steps: "CE answers ongoing ticket and verify answered status.",
      },
      {
        sectionName: "STUDENT AND CONTENT EXPERT",
        testCaseId: "TC_AU_06",
        title: "Student dispute moves to Dispute Ongoing",
        steps:
          "Student disputes answered ticket with remarks and verify dispute ongoing status.",
      },
      {
        sectionName: "STUDENT AND CONTENT EXPERT",
        testCaseId: "TC_AU_07",
        title: "Re-answer dispute moves to Dispute Answered",
        steps:
          "CE re-answers dispute ticket and verify dispute answered status.",
      },
    ],
  },
  {
    cycleName: "Planbook",
    moduleName: "Planbook",
    cases: [
      {
        sectionName: "Planbook",
        testCaseId: "PB_01",
        title: "Cannot create planbook with invalid title",
        steps: "Use special characters in title and try save.",
      },
      {
        sectionName: "Planbook",
        testCaseId: "PB_02",
        title: "Cannot create planbook with empty required fields",
        steps: "Leave required fields empty and save.",
      },
      {
        sectionName: "Planbook",
        testCaseId: "PB_03",
        title: "Cannot create planbook with past dates",
        steps: "Select past start date and save.",
      },
      {
        sectionName: "Planbook",
        testCaseId: "PB_04",
        title: "Cannot set end time earlier than start",
        steps: "Set start time later than end time and save.",
      },
      {
        sectionName: "Planbook",
        testCaseId: "PB_05",
        title: "Date click with plans opens planbook",
        steps: "Click a date with existing planbook and verify redirect.",
      },
      {
        sectionName: "Planbook",
        testCaseId: "PB_06",
        title: "Edit start date of planbook",
        steps: "Edit start date for editable planbook and save.",
      },
      {
        sectionName: "Planbook",
        testCaseId: "PB_07",
        title: "Edit title/description/color/time",
        steps: "Update editable plan fields and save.",
      },
      {
        sectionName: "Planbook",
        testCaseId: "PB_08",
        title: "Create Daily recurring planbook",
        steps: "Create planbook with repeat type Daily and end date.",
      },
      {
        sectionName: "Planbook",
        testCaseId: "PB_09",
        title: "Edit daily recurring plan - This Plan Only",
        steps: "Edit recurring daily plan and choose This Plan Only.",
      },
      {
        sectionName: "Planbook",
        testCaseId: "PB_10",
        title: "Edit daily recurring plan - This and Following",
        steps: "Edit recurring daily plan and choose This and Following Plans.",
      },
      {
        sectionName: "Planbook",
        testCaseId: "PB_11",
        title: "Daily recurring to Does Not Repeat - This Plan Only",
        steps: "Change repeat type and apply to This Plan Only.",
      },
      {
        sectionName: "Planbook",
        testCaseId: "PB_12",
        title: "Daily recurring to non-daily - This and Following",
        steps: "Change repeat type and apply to This and Following Plans.",
      },
      {
        sectionName: "Planbook",
        testCaseId: "PB_13",
        title: "Create weekly recurring planbook",
        steps: "Create planbook with weekly repeat on selected day.",
      },
      {
        sectionName: "Planbook",
        testCaseId: "PB_14",
        title: "Create custom recurring planbook",
        steps: "Create planbook with custom repeat days and end date.",
      },
      {
        sectionName: "Planbook",
        testCaseId: "PB_15",
        title: "Edit hidden for past plans",
        steps: "Verify edit action is hidden for past plans.",
      },
      {
        sectionName: "Planbook",
        testCaseId: "PB_16",
        title: "Delete non-recurring plan without recurrence popup",
        steps: "Delete does-not-repeat plan and verify direct delete flow.",
      },
      {
        sectionName: "Planbook",
        testCaseId: "PB_17",
        title: "Delete recurring with Delete All Plans",
        steps: "Delete recurring plan using Delete All Plans option.",
      },
      {
        sectionName: "Planbook",
        testCaseId: "PB_18",
        title: "Delete recurring with This Plan",
        steps: "Delete recurring plan using This Plan option.",
      },
      {
        sectionName: "Planbook",
        testCaseId: "PB_19",
        title: "Delete recurring with This and Following",
        steps: "Delete recurring plan using This and Following option.",
      },
      {
        sectionName: "Planbook",
        testCaseId: "PB_20",
        title: "Empty plan list/calendar state",
        steps:
          "When no plans exist, verify empty list/calendar and create/filter actions.",
      },
    ],
  },
  {
    cycleName: "Subscription & TC",
    moduleName: "Subscription & TC",
    cases: [
      {
        sectionName: "Student (Package Buy)",
        testCaseId: "SS_1",
        title: "Navigate to store page",
        steps:
          "Open store and verify plans, grade selection, Explore Plan button.",
      },
      {
        sectionName: "Student (Package Buy)",
        testCaseId: "SS_2",
        title: "Buy Premium package",
        steps:
          "Select grade, explore plan, buy via Stripe/PayPal, verify purchase and TC updates.",
      },
      {
        sectionName: "Student (Package Buy)",
        testCaseId: "SS_3",
        title: "Buy Custom package",
        steps:
          "Select custom subjects, verify pricing, purchase via Stripe/PayPal.",
      },
      {
        sectionName: "Student (Package Buy)",
        testCaseId: "SS_4",
        title: "Verify package bought",
        steps:
          "Verify upgraded cards, subscription details, notifications and email.",
      },
      {
        sectionName: "Student (Subject Extend)",
        testCaseId: "SS_5",
        title: "Navigate to store for extension",
        steps: "Open store and verify subscription plans and controls.",
      },
      {
        sectionName: "Student (Subject Extend)",
        testCaseId: "SS_6",
        title: "Extend button in manage subscription",
        steps:
          "Open manage subscription, click upgrade/extend, verify custom package preselection.",
      },
      {
        sectionName: "Student (Subject Extend)",
        testCaseId: "SS_7",
        title: "Extend subject via custom package",
        steps: "Select subject and complete extension via Stripe/PayPal.",
      },
      {
        sectionName: "Student (Subject Extend)",
        testCaseId: "SS_7",
        title: "Verify subject upgraded",
        steps:
          "Verify upgraded plan/date/status and extension notifications/email.",
      },
      {
        sectionName: "Tutor Credit",
        testCaseId: "SS_16",
        title: "Tutor Credit access points",
        steps: "Locate Tutor Credit buttons in Store and My Profile > Credits.",
      },
      {
        sectionName: "Tutor Credit",
        testCaseId: "SS_17",
        title: "Student buys tutor credit",
        steps:
          "Open Add Tutor Credit popup and complete purchase via Stripe/PayPal.",
      },
    ],
  },
  {
    cycleName: "Get answer a day",
    moduleName: "Get answer a day",
    cases: [
      {
        sectionName: "GOAD",
        testCaseId: "G001",
        title: "Redirection to Get one answer a day page",
        steps: "Click Get One Answer a Day from home and verify navigation.",
      },
      {
        sectionName: "GOAD",
        testCaseId: "G002",
        title: "Filter questions by subject/chapter",
        steps:
          "Use subject and chapter filters and verify relevant questions list.",
      },
      {
        sectionName: "GOAD",
        testCaseId: "G003",
        title: "Unlock an answer",
        steps:
          "Click Unlock Answer on a question and verify immediate unlock/display.",
      },
      {
        sectionName: "GOAD",
        testCaseId: "G004",
        title: "Navigation to Unlocked Answers",
        steps:
          "After unlock verify redirect and listing in Unlocked Answers page.",
      },
      {
        sectionName: "GOAD",
        testCaseId: "G005",
        title: "Content correctness check",
        steps:
          "Check subject/chapter mapping and answer availability (including LaTeX cases).",
      },
    ],
  },
];

const kfqSeedModules: SeedModule[] = [
  {
    cycleName: "Authentication",
    moduleName: "Authentication",
    cases: [
      {
        sectionName: "Join as Sifu",
        testCaseId: "RE001",
        title: "Registration - with valid details",
        steps:
          "Go to Registration page, enter valid details, click Join as Sifu.",
      },
      {
        sectionName: "Join as Sifu",
        testCaseId: "RE002",
        title: "Registration - while not ticking ToS/PP",
        steps: "Do not tick ToS/PP and click Join as Sifu.",
      },
      {
        sectionName: "Join as Sifu",
        testCaseId: "RE003",
        title: "Registration - with an existing email",
        steps: "Use existing email and click Join as Sifu.",
      },
      {
        sectionName: "Join as Sifu",
        testCaseId: "RE004",
        title: "Registration - with invalid Name format",
        steps: "Enter invalid name format and submit.",
      },
      {
        sectionName: "Join as Sifu",
        testCaseId: "RE005",
        title: "Registration - with invalid email format",
        steps: "Enter invalid email and submit.",
      },
      {
        sectionName: "Join as Sifu",
        testCaseId: "RE006",
        title: "Registration - with weak password",
        steps: "Enter weak password and submit.",
      },
      {
        sectionName: "Join as Sifu",
        testCaseId: "RE007",
        title: "Registration - case sensitivity of password",
        steps: "Use mismatched case passwords and submit.",
      },
      {
        sectionName: "Join as Sifu",
        testCaseId: "RE008",
        title: "Registration - with blank mandatory fields",
        steps: "Leave mandatory fields blank and submit.",
      },
      {
        sectionName: "Join as Sifu",
        testCaseId: "RE009",
        title: "Registration - with no internet connection",
        steps: "Disconnect internet and submit registration.",
      },
      {
        sectionName: "Join as Sifu",
        testCaseId: "RE010",
        title: "Registration - redirection after successful registration",
        steps: "Register successfully and verify redirection.",
      },
      {
        sectionName: "Join as Sifu",
        testCaseId: "RE011",
        title: "Registration - navigation inconsistency login/register",
        steps: "Use login/register navigation flow and verify behavior.",
      },
      {
        sectionName: "Join as Sifu",
        testCaseId: "RE012",
        title: "Registration - leading/trailing spaces in inputs",
        steps: "Enter spaces around input values and submit.",
      },
      {
        sectionName: "Join as Sifu",
        testCaseId: "RE013",
        title: "Registration - case sensitivity of email",
        steps: "Use mixed-case email values and submit.",
      },
      {
        sectionName: "Join as Sifu",
        testCaseId: "RE014",
        title: "Registration - special characters in name",
        steps: "Enter special chars in name and submit.",
      },
      {
        sectionName: "Join as Sifu",
        testCaseId: "RE015",
        title: "Registration - email verification",
        steps: "Register and verify email from inbox.",
      },
      {
        sectionName: "Join as Sifu",
        testCaseId: "RE016",
        title: "Registration - from app",
        steps: "Repeat registration flow from app.",
      },
      {
        sectionName: "Forget Password",
        testCaseId: "FP001",
        title: "Forgot Password link visible/clickable",
        steps: "Open login and click Forgot Password.",
      },
      {
        sectionName: "Forget Password",
        testCaseId: "FP002",
        title: "Reset with registered email",
        steps: "Submit registered email in forgot password.",
      },
      {
        sectionName: "Forget Password",
        testCaseId: "FP003",
        title: "Reset with unregistered email",
        steps: "Submit unregistered email in forgot password.",
      },
      {
        sectionName: "Forget Password",
        testCaseId: "FP004",
        title: "Reset with invalid email format",
        steps: "Submit invalid email format in forgot password.",
      },
      {
        sectionName: "Forget Password",
        testCaseId: "FP005",
        title: "Reset with blank email field",
        steps: "Leave email blank and submit.",
      },
      {
        sectionName: "Forget Password",
        testCaseId: "FP006",
        title: "Reset email link redirection",
        steps: "Open reset link from email and verify redirect.",
      },
      {
        sectionName: "Forget Password",
        testCaseId: "FP007",
        title: "Password reset form submission",
        steps: "Submit valid new password and confirmation.",
      },
      {
        sectionName: "Forget Password",
        testCaseId: "FP008",
        title: "Older reset link behavior",
        steps: "Try previously used/older reset link.",
      },
      {
        sectionName: "Forget Password",
        testCaseId: "FP009",
        title: "No internet during reset",
        steps: "Disconnect internet and submit reset request.",
      },
      {
        sectionName: "Login",
        testCaseId: "LG001",
        title: "Login with valid credentials",
        steps: "Login with valid credentials.",
      },
      {
        sectionName: "Login",
        testCaseId: "LG002",
        title: "Invalid password",
        steps: "Use valid email and invalid password.",
      },
      {
        sectionName: "Login",
        testCaseId: "LG003",
        title: "Unregistered email",
        steps: "Use unregistered email and submit.",
      },
      {
        sectionName: "Login",
        testCaseId: "LG004",
        title: "Blank fields",
        steps: "Leave login fields blank and submit.",
      },
      {
        sectionName: "Login",
        testCaseId: "LG005",
        title: "Invalid email format",
        steps: "Use invalid email format and submit.",
      },
      {
        sectionName: "Login",
        testCaseId: "LG006",
        title: "Unactivated account login",
        steps: "Try logging in with unactivated account.",
      },
      {
        sectionName: "Login",
        testCaseId: "LG007",
        title: "Network failure during login",
        steps: "Disconnect internet and submit login.",
      },
      {
        sectionName: "Login",
        testCaseId: "LG008",
        title: "Case sensitivity check for email",
        steps: "Login with mixed-case email and correct password.",
      },
      {
        sectionName: "Login",
        testCaseId: "LG009",
        title: "Multiple failed attempts",
        steps: "Repeat failed login attempts multiple times.",
      },
      {
        sectionName: "Login",
        testCaseId: "LG010",
        title: "Session persistence across tabs",
        steps: "Login in one tab and check session in another.",
      },
    ],
  },
  {
    cycleName: "Discover",
    moduleName: "Discover",
    cases: [
      {
        sectionName: "Discover Page",
        testCaseId: "DB001",
        title: "Search Functionality",
        steps: "Search by keyword on discover/dashboard.",
      },
      {
        sectionName: "Discover Page",
        testCaseId: "DB002",
        title: "Apply Content Filters",
        steps: "Open and apply filters.",
      },
      {
        sectionName: "Discover Page",
        testCaseId: "DB003",
        title: "Logo redirect after search/filter",
        steps: "Run search/filter and click logo.",
      },
      {
        sectionName: "Discover Page",
        testCaseId: "DB004",
        title: "Irrelevant results after scroll",
        steps: "Search keyword and scroll results.",
      },
      {
        sectionName: "Discover Page",
        testCaseId: "DB005",
        title: "Initiation of Video Challenge",
        steps: "Click Create Video Challenge.",
      },
      {
        sectionName: "Discover Page",
        testCaseId: "DB006",
        title: "Initiation of Quiz-only Challenge",
        steps: "Click Create Quiz-only Challenge.",
      },
      {
        sectionName: "Discover Page",
        testCaseId: "DB007",
        title: "Access Sifu Guide",
        steps: "Click View Sifu Guide.",
      },
      {
        sectionName: "Discover Page",
        testCaseId: "DB008",
        title: "Navigation to Premium/Upgrade",
        steps: "Click upgrade CTA from dashboard.",
      },
      {
        sectionName: "Discover Page",
        testCaseId: "DB009",
        title: "Top Sifu leaderboard",
        steps: "Open Top Sifu and select user.",
      },
      {
        sectionName: "Discover Page",
        testCaseId: "DB010",
        title: "Preview Public Quiz Card",
        steps: "Open a quiz card preview.",
      },
      {
        sectionName: "Discover Page",
        testCaseId: "DB011",
        title: "Quiz Card Action Menu",
        steps: "Open card 3-dot action menu.",
      },
      {
        sectionName: "Discover Page",
        testCaseId: "DB012",
        title: "Sifu Guide (Freemium)",
        steps: "Open freemium Sifu guide and verify content.",
      },
      {
        sectionName: "Discover Page",
        testCaseId: "DB013",
        title: "Validation error on optional thumbnail",
        steps: "Create video challenge without thumbnail.",
      },
      {
        sectionName: "Top Sifu",
        testCaseId: "TS001",
        title: "Top Sifu visibility",
        steps: "Verify Top Sifu section is visible.",
      },
      {
        sectionName: "Top Sifu",
        testCaseId: "TS002",
        title: "Leaderboard data points",
        steps: "Verify avatar, name, points.",
      },
      {
        sectionName: "Top Sifu",
        testCaseId: "TS003",
        title: "Ranking order",
        steps: "Verify descending sort by points.",
      },
      {
        sectionName: "Top Sifu",
        testCaseId: "TS004",
        title: "Redirect to public profile",
        steps: "Click sifu name and verify profile redirect.",
      },
      {
        sectionName: "Top Sifu",
        testCaseId: "TS005",
        title: "Verified badge status",
        steps: "Verify badge in leaderboard and profile.",
      },
      {
        sectionName: "Top Sifu",
        testCaseId: "TS006",
        title: "Profile header stats",
        steps: "Verify created/dojo/points stats.",
      },
      {
        sectionName: "Top Sifu",
        testCaseId: "TS007",
        title: "Profile filter - All",
        steps: "Apply All filter on profile content.",
      },
      {
        sectionName: "Top Sifu",
        testCaseId: "TS008",
        title: "Profile filter - Video Challenges",
        steps: "Apply video filter on profile.",
      },
      {
        sectionName: "Top Sifu",
        testCaseId: "TS009",
        title: "Profile filter - Quiz Challenges",
        steps: "Apply quiz filter on profile.",
      },
      {
        sectionName: "Top Sifu",
        testCaseId: "TS010",
        title: "Search within profile",
        steps: "Use profile search by challenge name.",
      },
      {
        sectionName: "Top Sifu",
        testCaseId: "TS011",
        title: "Challenge card details",
        steps: "Verify title/subject/grade/question count.",
      },
      {
        sectionName: "From Kung Fu Quiz Team",
        testCaseId: "FQ001",
        title: "Section visibility and placement",
        steps: "Verify section appears below primary cards.",
      },
      {
        sectionName: "From Kung Fu Quiz Team",
        testCaseId: "FQ002",
        title: "View All redirection",
        steps: "Click View All in section header.",
      },
      {
        sectionName: "From Kung Fu Quiz Team",
        testCaseId: "FQ003",
        title: "Metadata accuracy - video duration",
        steps: "Verify duration badge on video card.",
      },
      {
        sectionName: "From Kung Fu Quiz Team",
        testCaseId: "FQ004",
        title: "Metadata accuracy - quiz-only badge",
        steps: "Verify quiz-only badge on non-video card.",
      },
      {
        sectionName: "From Kung Fu Quiz Team",
        testCaseId: "FQ005",
        title: "Challenge statistic icons",
        steps: "Verify bamboo and dojo icons on card footer.",
      },
      {
        sectionName: "From Kung Fu Quiz Team",
        testCaseId: "FQ006",
        title: "Challenge action menu",
        steps: "Open 3-dot menu and verify actions.",
      },
      {
        sectionName: "From Kung Fu Quiz Team",
        testCaseId: "FQ007",
        title: "Subject/Grade label verification",
        steps: "Verify subject and grade labels.",
      },
      {
        sectionName: "Around the Kung Fu Arena",
        testCaseId: "AR001",
        title: "Section visibility and header",
        steps: "Scroll and verify section header.",
      },
      {
        sectionName: "Around the Kung Fu Arena",
        testCaseId: "AR002",
        title: "Author attribution",
        steps: "Verify author names on cards.",
      },
      {
        sectionName: "Around the Kung Fu Arena",
        testCaseId: "AR003",
        title: "Global content type filter - All",
        steps: "Apply All and verify mixed content.",
      },
      {
        sectionName: "Around the Kung Fu Arena",
        testCaseId: "AR004",
        title: "Content detail verification",
        steps: "Verify title/subject/grade on card.",
      },
    ],
  },
  {
    cycleName: "Challenges",
    moduleName: "Challenges",
    cases: [
      {
        sectionName: "Challenges Page",
        testCaseId: "CH001",
        title: "Navigation to Challenges Page",
        steps: "Open Challenges from sidebar.",
      },
      {
        sectionName: "Challenges Page",
        testCaseId: "CH002",
        title: "Redirection from Dashboard",
        steps: "Use dashboard create cards and verify redirect.",
      },
      {
        sectionName: "Challenges Page",
        testCaseId: "CH003",
        title: "Verify Empty State View",
        steps: "Open Challenges with new account.",
      },
      {
        sectionName: "Challenges Page",
        testCaseId: "CH004",
        title: "Verify Challenge List Display",
        steps: "Verify created challenge cards list.",
      },
      {
        sectionName: "Challenges Page",
        testCaseId: "CH005",
        title: "Initiation of Challenge Creation",
        steps: "Click Create New Challenge from empty state.",
      },
      {
        sectionName: "Challenges Page",
        testCaseId: "CH006",
        title: "Global Search for Challenges and Dojos",
        steps: "Search by keyword in top search.",
      },
      {
        sectionName: "Challenges Page",
        testCaseId: "CH007",
        title: "Sidebar Content Filter",
        steps: "Open/toggle filters sidebar.",
      },
      {
        sectionName: "Challenges Page",
        testCaseId: "CH008",
        title: "Create modal dismissal",
        steps: "Open create modal and close with X.",
      },
      {
        sectionName: "Challenges Page",
        testCaseId: "CH009",
        title: "Mode switching in modal",
        steps: "Switch between Video and Quiz-only modes.",
      },
      {
        sectionName: "Challenges Page",
        testCaseId: "CH010",
        title: "Character limit - challenge title",
        steps: "Enter very long title.",
      },
      {
        sectionName: "Challenges Page",
        testCaseId: "CH011",
        title: "Validation of optional dropdowns",
        steps: "Use optional subject/grade dropdowns.",
      },
      {
        sectionName: "Challenges Page",
        testCaseId: "CH012",
        title: "Thumbnail upload interaction",
        steps: "Upload image thumbnail.",
      },
      {
        sectionName: "Video Challenge",
        testCaseId: "CH013",
        title: "Video playback controls",
        steps: "Test play/pause/skip controls.",
      },
      {
        sectionName: "Video Challenge",
        testCaseId: "CH014",
        title: "Video speed adjustment",
        steps: "Change playback speed.",
      },
      {
        sectionName: "Video Challenge",
        testCaseId: "CH015",
        title: "Add question at timestamp",
        steps: "Add question at current timestamp.",
      },
      {
        sectionName: "Video Challenge",
        testCaseId: "CH016",
        title: "Empty questions state",
        steps: "Verify no-questions state.",
      },
      {
        sectionName: "Video Challenge",
        testCaseId: "CH017",
        title: "Publish challenge validation",
        steps: "Try publish from draft and verify validation.",
      },
      {
        sectionName: "Video Challenge",
        testCaseId: "CH018",
        title: "Preview mode toggle",
        steps: "Toggle preview mode.",
      },
      {
        sectionName: "Video Challenge",
        testCaseId: "CH019",
        title: "Edit challenge details",
        steps: "Open edit details flow.",
      },
      {
        sectionName: "Video Challenge",
        testCaseId: "CH020",
        title: "Switch to Dojo view",
        steps: "Open Dojos tab from challenge.",
      },
      {
        sectionName: "Video Challenge",
        testCaseId: "CH021",
        title: "Navigation back to list",
        steps: "Use back to Challenges link.",
      },
      {
        sectionName: "Video Challenge",
        testCaseId: "CH022",
        title: "Metadata display",
        steps: "Verify subject/grade/date metadata.",
      },
      {
        sectionName: "Publish Challenge",
        testCaseId: "CH023",
        title: "Publish challenge - Public",
        steps: "Publish a finished challenge as public.",
      },
      {
        sectionName: "Publish Challenge",
        testCaseId: "CH024",
        title: "Publish challenge - Private (Premium)",
        steps: "Try private publish option and verify gating.",
      },
      {
        sectionName: "Publish Challenge",
        testCaseId: "CH025",
        title: "Cancel publication",
        steps: "Open publish modal and cancel.",
      },
      {
        sectionName: "Publish Challenge",
        testCaseId: "CH026",
        title: "Modal summary info",
        steps: "Verify title/thumbnail/subject/grade summary.",
      },
      {
        sectionName: "Publish Challenge",
        testCaseId: "CH027",
        title: "Question count in publish modal",
        steps: "Verify question count display.",
      },
      {
        sectionName: "Publish Challenge",
        testCaseId: "CH028",
        title: "Dismiss modal via close icon",
        steps: "Close publish modal with X.",
      },
      {
        sectionName: "Publish Challenge",
        testCaseId: "CH029",
        title: "Post-publish edit restriction",
        steps: "Attempt edit after publish.",
      },
      {
        sectionName: "Publish Challenge",
        testCaseId: "CH030",
        title: "Discover page visibility after publish",
        steps: "Search published challenge in Discover.",
      },
      {
        sectionName: "Share Dojo",
        testCaseId: "CH031",
        title: "Create/share dojo default settings",
        steps: "Open share dojo modal and create with defaults.",
      },
      {
        sectionName: "Share Dojo",
        testCaseId: "CH032",
        title: "Custom dojo naming",
        steps: "Set custom dojo name and create.",
      },
      {
        sectionName: "Share Dojo",
        testCaseId: "CH033",
        title: "Player limit - limited players",
        steps: "Set limited players count and create.",
      },
      {
        sectionName: "Share Dojo",
        testCaseId: "CH034",
        title: "Player limit - unlimited (Premium)",
        steps: "Try unlimited players option.",
      },
      {
        sectionName: "Share Dojo",
        testCaseId: "CH035",
        title: "Dojo expiration - fixed date",
        steps: "Set fixed expiration date/time.",
      },
      {
        sectionName: "Share Dojo",
        testCaseId: "CH036",
        title: "Dojo expiration - no expiration (Premium)",
        steps: "Try no-expiration option.",
      },
      {
        sectionName: "Share Dojo",
        testCaseId: "CH037",
        title: "Pass threshold adjustment",
        steps: "Change pass threshold percentage.",
      },
      {
        sectionName: "Share Dojo",
        testCaseId: "CH038",
        title: "Dojo mode selection",
        steps: "Switch dojo mode values.",
      },
      {
        sectionName: "Share Dojo",
        testCaseId: "CH039",
        title: "Validation: empty dojo name",
        steps: "Clear dojo name and attempt create.",
      },
      {
        sectionName: "Share Dojo",
        testCaseId: "CH040",
        title: "Cancel dojo creation",
        steps: "Modify fields and cancel.",
      },
      {
        sectionName: "Create Flashcard",
        testCaseId: "FL001",
        title: "Flashcard modal initialization",
        steps: "Open create challenge and choose Flashcard mode.",
      },
      {
        sectionName: "Create Flashcard",
        testCaseId: "FL002",
        title: "Validation: required title",
        steps: "Leave title empty and submit.",
      },
      {
        sectionName: "Create Flashcard",
        testCaseId: "FL003",
        title: "Empty state and Add Question",
        steps: "Create flashcard challenge and verify empty state.",
      },
      {
        sectionName: "Create Flashcard",
        testCaseId: "FL004",
        title: "Flashcard editor functionality",
        steps: "Add question/answer in editor.",
      },
      {
        sectionName: "Create Flashcard",
        testCaseId: "FL005",
        title: "Real-time flashcard preview",
        steps: "Verify live preview while typing.",
      },
      {
        sectionName: "Create Flashcard",
        testCaseId: "FL006",
        title: "Save and question management",
        steps: "Save first question and add second.",
      },
      {
        sectionName: "Create Flashcard",
        testCaseId: "FL007",
        title: "Flashcard deletion",
        steps: "Delete an existing flashcard question.",
      },
      {
        sectionName: "Create Flashcard",
        testCaseId: "FL008",
        title: "Publish modal verification",
        steps: "Open publish modal from draft.",
      },
      {
        sectionName: "Create Flashcard",
        testCaseId: "FL009",
        title: "Visibility logic private/public",
        steps: "Verify make challenge visibility options.",
      },
      {
        sectionName: "Create Flashcard",
        testCaseId: "FL010",
        title: "Finalization warning",
        steps: "Verify warning text in publish modal.",
      },
    ],
  },
  {
    cycleName: "Dojos",
    moduleName: "Dojos",
    cases: [
      {
        sectionName: "Dojos",
        testCaseId: "DJ001",
        title: "Navigation to Dojos page",
        steps: "Open Dojos from sidebar.",
      },
      {
        sectionName: "Dojos",
        testCaseId: "DJ002",
        title: "Sidebar re-click behavior",
        steps: "Click Dojos icon again on Dojos page.",
      },
      {
        sectionName: "Dojos",
        testCaseId: "DJ003",
        title: "Filter by challenge type - All",
        steps: "Apply All filter.",
      },
      {
        sectionName: "Dojos",
        testCaseId: "DJ004",
        title: "Filter by challenge type - Video",
        steps: "Apply Video filter.",
      },
      {
        sectionName: "Dojos",
        testCaseId: "DJ005",
        title: "Filter by challenge type - Quiz",
        steps: "Apply Quiz filter.",
      },
      {
        sectionName: "Dojos",
        testCaseId: "DJ006",
        title: "Search personal dojos",
        steps: "Search by dojo keyword.",
      },
      {
        sectionName: "Dojos",
        testCaseId: "DJ007",
        title: "Filter by dojo group",
        steps: "Use All Dojos dropdown.",
      },
      {
        sectionName: "Dojos",
        testCaseId: "DJ008",
        title: "Filter by dojo status",
        steps: "Use status dropdown.",
      },
      {
        sectionName: "Dojos",
        testCaseId: "DJ009",
        title: "Verify dojo card badges",
        steps: "Check quiz-only/video badges.",
      },
      {
        sectionName: "Dojos",
        testCaseId: "DJ010",
        title: "Open dojo insights",
        steps: "Open dojo card and verify stats panel.",
      },
      {
        sectionName: "Dojos",
        testCaseId: "DJ011",
        title: "Verify sidebar count",
        steps: "Match header count with dojo list.",
      },
      {
        sectionName: "Dojos",
        testCaseId: "DJ012",
        title: "Page state during reload",
        steps: "Refresh Dojos page and verify state.",
      },
      {
        sectionName: "Dojo Insight Page",
        testCaseId: "DI001",
        title: "Dojo header information",
        steps: "Verify dojo name/subject/grade.",
      },
      {
        sectionName: "Dojo Insight Page",
        testCaseId: "DI002",
        title: "Summary card accuracy",
        steps: "Verify mode/created/expiry values.",
      },
      {
        sectionName: "Dojo Insight Page",
        testCaseId: "DI003",
        title: "Player participation tracking",
        steps: "Join dojo and verify participation count.",
      },
      {
        sectionName: "Dojo Insight Page",
        testCaseId: "DI004",
        title: "Total question submission counter",
        steps: "Submit attempt and verify count.",
      },
      {
        sectionName: "Dojo Insight Page",
        testCaseId: "DI005",
        title: "Pass/fail chart",
        steps: "Verify donut chart values.",
      },
      {
        sectionName: "Dojo Insight Page",
        testCaseId: "DI006",
        title: "Challenge accuracy insights chart",
        steps: "Verify correct/incorrect per question.",
      },
      {
        sectionName: "Dojo Insight Page",
        testCaseId: "DI007",
        title: "Leaderboard ranking",
        steps: "Verify rank order by score.",
      },
      {
        sectionName: "Dojo Insight Page",
        testCaseId: "DI008",
        title: "Leaderboard full screen view",
        steps: "Open leaderboard full screen.",
      },
      {
        sectionName: "Dojo Insight Page",
        testCaseId: "DI009",
        title: "Live status and dojo code display",
        steps: "Verify active badge and dojo code.",
      },
      {
        sectionName: "Dojo Insight Page",
        testCaseId: "DI010",
        title: "External link action",
        steps: "Open external link for student entry.",
      },
      {
        sectionName: "Dojo Insight Page",
        testCaseId: "DI011",
        title: "Dojo settings dropdown",
        steps: "Open 3-dot settings and verify options.",
      },
    ],
  },
  {
    cycleName: "Profile",
    moduleName: "Profile",
    cases: [
      {
        sectionName: "Account Information",
        testCaseId: "MP001",
        title: "Update avatar with valid image",
        steps: "Upload valid avatar and save.",
      },
      {
        sectionName: "Account Information",
        testCaseId: "MP002",
        title: "Unsupported avatar file type",
        steps: "Upload non-image file.",
      },
      {
        sectionName: "Account Information",
        testCaseId: "MP003",
        title: "Avatar exceeding size limit",
        steps: "Upload image larger than limit.",
      },
      {
        sectionName: "Account Information",
        testCaseId: "MP004",
        title: "Remove avatar",
        steps: "Remove avatar and save.",
      },
      {
        sectionName: "Account Information",
        testCaseId: "MP005",
        title: "Discard avatar change",
        steps: "Upload avatar then discard.",
      },
      {
        sectionName: "Account Information",
        testCaseId: "MP006",
        title: "Refresh after unsaved avatar change",
        steps: "Upload avatar and refresh without save.",
      },
      {
        sectionName: "Account Information",
        testCaseId: "MP007",
        title: "Save full name with valid input",
        steps: "Update full name and save.",
      },
      {
        sectionName: "Account Information",
        testCaseId: "MP008",
        title: "Discard full name change",
        steps: "Edit full name then discard.",
      },
      {
        sectionName: "Account Information",
        testCaseId: "MP009",
        title: "Full name empty validation",
        steps: "Clear full name and save.",
      },
      {
        sectionName: "Account Information",
        testCaseId: "MP010",
        title: "Full name special characters",
        steps: "Enter special characters in name.",
      },
      {
        sectionName: "Account Information",
        testCaseId: "MP011",
        title: "Email field read-only",
        steps: "Attempt editing email field.",
      },
      {
        sectionName: "Account Information",
        testCaseId: "MP012",
        title: "Email update via dev tools",
        steps: "Attempt tampered email save.",
      },
      {
        sectionName: "Account Information",
        testCaseId: "MP013",
        title: "Save disabled with no changes",
        steps: "Open profile and verify no-change state.",
      },
      {
        sectionName: "Account Information",
        testCaseId: "MP014",
        title: "Save avatar and full name together",
        steps: "Update both fields and save.",
      },
      {
        sectionName: "Account Information",
        testCaseId: "MP015",
        title: "Manually revert full name",
        steps: "Change then revert full name.",
      },
      {
        sectionName: "Account Information",
        testCaseId: "MP016",
        title: "Refresh with unsaved changes",
        steps: "Make unsaved changes and refresh page.",
      },
      {
        sectionName: "Change Password",
        testCaseId: "MP017",
        title: "Change Password UI first-time setup",
        steps: "Verify change password section for first setup.",
      },
      {
        sectionName: "Change Password",
        testCaseId: "MP018",
        title: "Change Password button disabled by default",
        steps: "Verify default disabled state.",
      },
      {
        sectionName: "Change Password",
        testCaseId: "MP019",
        title: "Minimum length rule not satisfied",
        steps: "Enter password shorter than minimum.",
      },
      {
        sectionName: "Change Password",
        testCaseId: "MP020",
        title: "Minimum length rule satisfied",
        steps: "Enter password meeting minimum length.",
      },
      {
        sectionName: "Change Password",
        testCaseId: "MP021",
        title: "Upper/lowercase rule not satisfied",
        steps: "Enter lowercase-only password.",
      },
      {
        sectionName: "Change Password",
        testCaseId: "MP022",
        title: "Upper/lowercase rule satisfied",
        steps: "Enter mixed-case password.",
      },
      {
        sectionName: "Change Password",
        testCaseId: "MP023",
        title: "Numeric character rule not satisfied",
        steps: "Enter password without numbers.",
      },
      {
        sectionName: "Change Password",
        testCaseId: "MP024",
        title: "Numeric character rule satisfied",
        steps: "Enter password with number.",
      },
      {
        sectionName: "Change Password",
        testCaseId: "MP025",
        title: "Special character rule not satisfied",
        steps: "Enter password without special char.",
      },
      {
        sectionName: "Change Password",
        testCaseId: "MP026",
        title: "Special character rule satisfied",
        steps: "Enter password with special char.",
      },
      {
        sectionName: "Change Password",
        testCaseId: "MP027",
        title: "Button disabled if rules not met",
        steps: "Use invalid password + confirm.",
      },
      {
        sectionName: "Change Password",
        testCaseId: "MP028",
        title: "Button enabled when rules met",
        steps: "Use valid matching passwords.",
      },
      {
        sectionName: "Change Password",
        testCaseId: "MP029",
        title: "Mismatch new and confirm password",
        steps: "Use non-matching confirm password.",
      },
      {
        sectionName: "Change Password",
        testCaseId: "MP030",
        title: "Successful password creation",
        steps: "Set valid first-time password.",
      },
      {
        sectionName: "Change Password",
        testCaseId: "MP031",
        title: "Change Password UI after password set",
        steps: "Verify UI for existing-password user.",
      },
      {
        sectionName: "Change Password",
        testCaseId: "MP032",
        title: "Button disabled by default existing user",
        steps: "Verify disabled state before input.",
      },
      {
        sectionName: "Change Password",
        testCaseId: "MP033",
        title: "Incorrect old password error",
        steps: "Use incorrect old password and submit.",
      },
      {
        sectionName: "Change Password",
        testCaseId: "MP034",
        title: "New password rules apply for existing user",
        steps: "Enter invalid new password and verify rules.",
      },
      {
        sectionName: "Change Password",
        testCaseId: "MP035",
        title: "Button enabled with valid old/new password",
        steps: "Use valid old/new matching confirmation.",
      },
      {
        sectionName: "Change Password",
        testCaseId: "MP036",
        title: "Successful password change existing user",
        steps: "Submit valid old/new password change.",
      },
      {
        sectionName: "Change Password",
        testCaseId: "MP037",
        title: "Password change blocked with invalid naming rule",
        steps: "Verify invalid password naming is blocked.",
      },
      {
        sectionName: "Preferences",
        testCaseId: "MP038",
        title: "Preferences section UI",
        steps: "Open and verify preferences UI.",
      },
      {
        sectionName: "Preferences",
        testCaseId: "MP039",
        title: "Single subject selection",
        steps: "Select one subject.",
      },
      {
        sectionName: "Preferences",
        testCaseId: "MP040",
        title: "Multiple subject selection",
        steps: "Select multiple subjects.",
      },
      {
        sectionName: "Preferences",
        testCaseId: "MP041",
        title: "Single grade selection",
        steps: "Select one grade.",
      },
      {
        sectionName: "Preferences",
        testCaseId: "MP042",
        title: "Multiple grade selection",
        steps: "Select multiple grades.",
      },
      {
        sectionName: "Preferences",
        testCaseId: "MP043",
        title: "Update preferences disabled by default",
        steps: "Verify button disabled with no changes.",
      },
      {
        sectionName: "Preferences",
        testCaseId: "MP044",
        title: "Button enabled on subject selection",
        steps: "Select subject and verify button.",
      },
      {
        sectionName: "Preferences",
        testCaseId: "MP045",
        title: "Button enabled on grade selection",
        steps: "Select grade and verify button.",
      },
      {
        sectionName: "Preferences",
        testCaseId: "MP046",
        title: "Button enabled with subject+grade",
        steps: "Select subject and grade.",
      },
      {
        sectionName: "Preferences",
        testCaseId: "MP047",
        title: "Update single subject/single grade",
        steps: "Save one subject and one grade.",
      },
      {
        sectionName: "Preferences",
        testCaseId: "MP048",
        title: "Update multiple subjects/single grade",
        steps: "Save multiple subjects and one grade.",
      },
      {
        sectionName: "Preferences",
        testCaseId: "MP049",
        title: "Update single subject/multiple grades",
        steps: "Save one subject and multiple grades.",
      },
      {
        sectionName: "Preferences",
        testCaseId: "MP050",
        title: "Update multiple subjects/multiple grades",
        steps: "Save multiple subjects and grades.",
      },
      {
        sectionName: "Preferences",
        testCaseId: "MP051",
        title: "Preferences persist after refresh",
        steps: "Save preferences and refresh.",
      },
      {
        sectionName: "Preferences",
        testCaseId: "MP052",
        title: "Previously saved preferences pre-selected",
        steps: "Re-open preferences and verify pre-selection.",
      },
      {
        sectionName: "Preferences",
        testCaseId: "MP053",
        title: "Modify saved preferences",
        steps: "Change selection and save again.",
      },
      {
        sectionName: "Preferences",
        testCaseId: "MP054",
        title: "Home videos follow preferences",
        steps: "Verify home recommendations match saved preferences.",
      },
      {
        sectionName: "Preferences",
        testCaseId: "MP055",
        title: "Home updates after preference change",
        steps: "Change preferences and verify updated recommendations.",
      },
      {
        sectionName: "Preferences",
        testCaseId: "MP056",
        title: "Button behavior with no option selected",
        steps: "Deselect all subjects/grades and verify behavior.",
      },
      {
        sectionName: "Preferences",
        testCaseId: "MP057",
        title: "Select all subjects",
        steps: "Select every subject option.",
      },
      {
        sectionName: "Preferences",
        testCaseId: "MP058",
        title: "Select all grades",
        steps: "Select every grade option.",
      },
      {
        sectionName: "Preferences",
        testCaseId: "MP059",
        title: "Unselect selected subjects/grades",
        steps: "Unselect previously selected values.",
      },
      {
        sectionName: "Preferences",
        testCaseId: "MP060",
        title: "Button enabled after unselecting",
        steps: "Unselect at least one selected preference.",
      },
      {
        sectionName: "Preferences",
        testCaseId: "MP061",
        title: "Update after unselecting some preferences",
        steps: "Unselect one value and save.",
      },
      {
        sectionName: "Preferences",
        testCaseId: "MP062",
        title: "Update after unselecting all preferences",
        steps: "Unselect all and save.",
      },
      {
        sectionName: "Preferences",
        testCaseId: "MP063",
        title: "Home updates after unselecting preferences",
        steps: "Unselect and verify recommendation updates.",
      },
      {
        sectionName: "Preferences",
        testCaseId: "MP064",
        title: "Removed prefs no longer recommended",
        steps: "Verify removed subject/grade no longer recommended.",
      },
      {
        sectionName: "Subscription (Premium)",
        testCaseId: "SP001",
        title: "Subscription section UI",
        steps: "Open subscription tab and verify layout.",
      },
      {
        sectionName: "Subscription (Premium)",
        testCaseId: "SP002",
        title: "Premium features list visibility",
        steps: "Verify features included list.",
      },
      {
        sectionName: "Subscription (Premium)",
        testCaseId: "SP003",
        title: "Days remaining counter",
        steps: "Verify days remaining in banner.",
      },
      {
        sectionName: "Subscription (Premium)",
        testCaseId: "SP004",
        title: "Payment details modal appearance",
        steps: "Open payment details modal.",
      },
      {
        sectionName: "Subscription (Premium)",
        testCaseId: "SP005",
        title: "Payment details data accuracy",
        steps: "Verify subscribed by and date values.",
      },
      {
        sectionName: "Subscription (Premium)",
        testCaseId: "SP006",
        title: "Closing payment details modal",
        steps: "Close modal using X.",
      },
      {
        sectionName: "Subscription (Premium)",
        testCaseId: "SP007",
        title: "Search bar on subscription page",
        steps: "Search challenges from subscription page.",
      },
      {
        sectionName: "Subscription (Premium)",
        testCaseId: "SP008",
        title: "Filter button responsiveness",
        steps: "Open filters from subscription page.",
      },
      {
        sectionName: "Subscription (Premium)",
        testCaseId: "SP009",
        title: "Navigation sidebar icons",
        steps: "Navigate using sidebar icons from profile/subscription.",
      },
    ],
  },
  {
    cycleName: "Upgrade now",
    moduleName: "Upgrade now",
    cases: [
      {
        sectionName: "Upgrade Now",
        testCaseId: "UP001",
        title: "Upgrade pop-up",
        steps: "Click Upgrade Now and verify popup.",
      },
      {
        sectionName: "Upgrade Now",
        testCaseId: "UP002",
        title: "Premium value propositions",
        steps: "Verify listed premium benefits in popup.",
      },
      {
        sectionName: "Upgrade Now",
        testCaseId: "UP003",
        title: "Initiate upgrade flow",
        steps: "Click Upgrade Now in popup.",
      },
      {
        sectionName: "Upgrade Now",
        testCaseId: "UP004",
        title: "Dismiss upgrade pop-up",
        steps: "Close upgrade modal via X.",
      },
      {
        sectionName: "Upgrade Now",
        testCaseId: "UP005",
        title: "Subscription redirection",
        steps: "Navigate to My Profile > Subscription through upgrade flow.",
      },
    ],
  },
];

const seedSuites: SeedSuite[] = [
  { rootName: "HSA", folderName: "Test Cycle 1", modules: hsaSeedModules },
  { rootName: "KFQ", folderName: "Test Cycle 1", modules: kfqSeedModules },
];

async function main() {
  const client = new MongoClient(mongoUri);
  await client.connect();

  try {
    const db = client.db(dbName);
    await db.dropDatabase();

    const users = db.collection("users");
    const sessions = db.collection("sessions");
    const defects = db.collection("defects");
    const loginVerificationCodes = db.collection("login_verification_codes");
    const passwordResetTokens = db.collection("password_reset_tokens");
    const testCycles = db.collection("test_cycles");
    const testCases = db.collection("test_cases");
    const testExecutions = db.collection("test_executions");
    const testCycleRuns = db.collection("test_cycle_runs");

    await Promise.all([
      defects.createIndex({ id: 1 }, { unique: true }),
      defects.createIndex({ dateReported: -1 }),
      defects.createIndex({ status: 1 }),
      defects.createIndex({ severity: 1 }),
      defects.createIndex({ module: 1 }),
      users.createIndex({ id: 1 }, { unique: true }),
      users.createIndex({ email: 1 }, { unique: true }),
      sessions.createIndex({ id: 1 }, { unique: true }),
      sessions.createIndex({ userId: 1 }),
      sessions.createIndex({ expiresAt: 1 }),
      loginVerificationCodes.createIndex({ id: 1 }, { unique: true }),
      loginVerificationCodes.createIndex({ userId: 1, expiresAt: -1 }),
      passwordResetTokens.createIndex({ id: 1 }, { unique: true }),
      passwordResetTokens.createIndex({ token_hash: 1 }, { unique: true }),
      passwordResetTokens.createIndex({ userId: 1, expiresAt: -1 }),
      testCycles.createIndex({ id: 1 }, { unique: true }),
      testCycles.createIndex({ parentId: 1, createdAt: -1 }),
      testCycles.createIndex({ kind: 1, createdAt: -1 }),
      testCycles.createIndex({ createdAt: -1 }),
      testCases.createIndex({ id: 1 }, { unique: true }),
      testCases.createIndex({ cycleId: 1, testCaseId: 1 }, { unique: true }),
      testCases.createIndex({
        cycleId: 1,
        moduleName: 1,
        sectionName: 1,
        testCaseId: 1,
      }),
      testCases.createIndex({ cycleId: 1, sectionName: 1, testCaseId: 1 }),
      testExecutions.createIndex({ id: 1 }, { unique: true }),
      testExecutions.createIndex(
        { cycleId: 1, testCaseId: 1 },
        { unique: true },
      ),
      testCycleRuns.createIndex({ id: 1 }, { unique: true }),
      testCycleRuns.createIndex({ cycleId: 1, createdAt: -1 }),
    ]);

    const adminEmail = "sarthak.sharma@innovatetech.co";
    const adminPassword = "Admin@123456";
    const now = new Date();

    const adminId = randomUUID();
    await users.insertOne({
      id: adminId,
      name: "Super Admin",
      email: adminEmail,
      phone: "9800000000",
      password_hash: hashPassword(adminPassword),
      role: "super_admin",
      createdAt: now,
      updatedAt: now,
    });

    const testCaseDocs: Array<{
      id: string;
      testCaseId: string;
      moduleName: string;
      sectionName: string;
      title: string;
      steps: string;
      expectedResult: string;
      cycleId: string;
      createdAt: Date;
    }> = [];

    let totalSeededChildCycles = 0;
    let totalSeededScopes = 0;

    for (const suite of seedSuites) {
      const rootFolderId = randomUUID();
      const childCycleId = randomUUID();

      await testCycles.insertMany([
        {
          id: rootFolderId,
          name: suite.rootName,
          kind: "folder",
          parentId: null,
          description: `Seeded root folder: ${suite.rootName}`,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: childCycleId,
          name: suite.folderName,
          kind: "cycle",
          parentId: rootFolderId,
          description: `Seeded child cycle for ${suite.rootName}`,
          createdAt: now,
          updatedAt: now,
        },
      ]);

      const scopeDocs = suite.modules.map((moduleSeed) => ({
        id: randomUUID(),
        name: moduleSeed.cycleName,
        kind: "folder" as const,
        parentId: childCycleId,
        description: `Seeded scope: ${moduleSeed.cycleName}`,
        createdAt: now,
        updatedAt: now,
      }));

      await testCycles.insertMany(scopeDocs);
      totalSeededChildCycles += 1;
      totalSeededScopes += suite.modules.length;

      const seenIds = new Map<string, number>();

      for (const moduleSeed of suite.modules) {
        for (const seedCase of moduleSeed.cases) {
          const normalizedId = seedCase.testCaseId.trim();
          const count = (seenIds.get(normalizedId) ?? 0) + 1;
          seenIds.set(normalizedId, count);

          const dedupedTestCaseId =
            count === 1 ? normalizedId : `${normalizedId}-${count}`;

          testCaseDocs.push({
            id: randomUUID(),
            testCaseId: dedupedTestCaseId,
            moduleName: moduleSeed.moduleName,
            sectionName: seedCase.sectionName,
            title: seedCase.title,
            steps: seedCase.steps,
            expectedResult: "",
            cycleId: childCycleId,
            createdAt: now,
          });
        }
      }
    }

    if (testCaseDocs.length > 0) {
      await testCases.insertMany(testCaseDocs);
    }

    const sessionId = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await sessions.insertOne({
      id: sessionId,
      userId: adminId,
      expiresAt,
    });

    console.log("✅ MongoDB seeded successfully");
    console.log("Database was fully cleared before reseeding.");
    console.log(`DB: ${dbName}`);
    console.log(`Admin email: ${adminEmail}`);
    console.log(`Admin password: ${adminPassword}`);
    console.log(`Session cookie: bbt_session=${sessionId}`);
    console.log("Seeded hierarchy: Main Folder > Child Cycle > Scope");
    console.log(`Seeded child cycles: ${totalSeededChildCycles}`);
    console.log(`Seeded scopes: ${totalSeededScopes}`);
    console.log(`Seeded test cases: ${testCaseDocs.length}`);
    console.log("\nUse this for authenticated curl requests:");
    console.log(`-H 'Cookie: bbt_session=${sessionId}'`);
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
