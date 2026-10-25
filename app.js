/*
 * ============================================================
 *  STUDENT BOOTCAMP MANAGER
 *  GoldenByte Coding Bootcamp
 *  JavaScript Essentials 2,Module 4 (3-day project sprint)
 * ============================================================
 *  Run in a terminal: node app.js
 *  Or open index.html in a browser (the output shows on the page).
 *
 *  How the file is organised (same order as the 3 days of the sprint):
 *  1.Configuration (IIFE)                      Day 2
 *  2.Student ID generator (generator function)  Day 2
 *  3.Student registration (default,rest,spread) Day 1
 *  4.Averages and PASS/FAIL                     Day 1
 *  5.Processing counter (closure)               Day 2
 *  6.this,call(),apply(),bind()                 Day 2
 *  7.Functions as values,higher-order functions Day 2
 *  8.Async processing with setTimeout + callbacks Day 3
 *  9.Final report                                Day 3
 *  10.Running the app (registration,demos,tests,async processing)
 *
 *  MDN pages I used:
 *  Default parameters: developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Default_parameters
 *  Rest parameters:    developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters
 *  Closures:           developer.mozilla.org/en-US/docs/Web/JavaScript/Closures
 *  IIFE:               developer.mozilla.org/en-US/docs/Glossary/IIFE
 *  this:               developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this
 *  Generators:         developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*
 *  setTimeout:         developer.mozilla.org/en-US/docs/Web/API/setTimeout
 */

// Small helper so section headings show in gold in the terminal.
// \x1b[...m are "ANSI colour codes" that terminals understand.The browser page strips them out.
const GOLD = "\x1b[38;5;178m";
const RESET = "\x1b[0m";
function heading(title) {
  console.log(`\n${GOLD}==================== ${title} ====================${RESET}`);
}

// ============================================================
// 1.CONFIGURATION (IIFE)
// ============================================================
// An IIFE (Immediately Invoked Function Expression) is a function that runs the moment it's defined.
// Everything declared inside it is private.The outside world only gets what I return,
// so nobody can accidentally do passingMark = 10 and pass the whole class.
const BootcampConfig = (function () {
  const bootcampName = "GoldenByte Coding Bootcamp";
  const appVersion = "1.0.0";
  let passingMark = 50; // the default passing mark from the brief

  return {
    getBootcampName() {
      return bootcampName;
    },
    getVersion() {
      return appVersion;
    },
    getPassingMark() {
      return passingMark;
    },
    // The ONLY way to change the passing mark,and it checks the value first.
    setPassingMark(newMark) {
      if (typeof newMark !== "number" || Number.isNaN(newMark) || newMark < 0 || newMark > 100) {
        console.log(`Config: ${newMark} is not a valid passing mark (must be 0 to 100).Keeping ${passingMark}.`);
        return false;
      }
      passingMark = newMark;
      return true;
    },
  };
})(); // <- these brackets are what make it run immediately

// ============================================================
// 2.STUDENT ID GENERATOR (generator function)
// ============================================================
// function* makes a generator.Each time I call .next(),it runs until the next "yield",
// hands back that value,and PAUSES right there until it's asked again.
// Because it remembers where it stopped,every ID is unique and in order: GB-001,GB-002...
// The while(true) loop is safe because it pauses at every yield,it never runs away.
function* studentIdGenerator(prefix = "GB", startAt = 1) {
  let nextNumber = startAt;
  while (true) {
    yield `${prefix}-${String(nextNumber).padStart(3,"0")}`;
    nextNumber++;
  }
}
const idGenerator = studentIdGenerator();

// ============================================================
// 3.STUDENT REGISTRATION (default parameters,rest parameters,spread)
// ============================================================
const students = []; // every registered student is stored in this array
const DEFAULT_COURSE = "Full-Stack Web Development";

// Shared methods every student object gets.Inside these,"this" is the student the method is called on.
const studentMethods = {
  getAverage() {
    return calculateAverage(this.marks);
  },
  getStatus() {
    return determineStatus(this.getAverage());
  },
  describe() {
    return `${this.id} | ${this.name} | ${this.course}`;
  },
};

// Checks one mark.Must be a real number from 0 to 100.
function isValidMark(mark) {
  return typeof mark === "number" && !Number.isNaN(mark) && mark >= 0 && mark <= 100;
}

// DEFAULT PARAMETER: course = DEFAULT_COURSE.If no course is given (or undefined is passed),
// the student is put on the Full-Stack course automatically.
// REST PARAMETER: ...marks collects ALL the remaining arguments into one array,
// so one student can have 1 mark and another can have 5,using the same function.
function registerStudent(name, course = DEFAULT_COURSE, ...marks) {
  if (typeof name !== "string" || name.trim() === "") {
    console.log(`Registration failed: "${name}" is not a valid student name.`);
    return null;
  }

  // Keep the good marks and report the bad ones,instead of crashing or silently using them.
  const validMarks = marks.filter(isValidMark);
  const invalidMarks = marks.filter((mark) => !isValidMark(mark));
  if (invalidMarks.length > 0) {
    console.log(`Warning for ${name.trim()}: ignored invalid mark(s): ${invalidMarks.join(",")}`);
  }

  // Object.create(studentMethods) links the new student to the shared methods above.
  const student = Object.create(studentMethods);
  student.id = idGenerator.next().value; // .next() asks the generator for the next unique ID
  student.name = name.trim();
  student.course = course;
  student.marks = [...validMarks]; // SPREAD: copies the marks into a fresh array the student owns

  students.push(student);
  return student;
}

// SPREAD again: push(...newMarks) unpacks the array so each mark is added separately.
// Without the spread,the whole array would be added as ONE item: [70,[80,90]].
function addMarks(studentId, ...newMarks) {
  const student = findStudentById(studentId);
  if (!student) {
    console.log(`addMarks: no student with ID ${studentId}.`);
    return false;
  }
  student.marks.push(...newMarks.filter(isValidMark));
  return true;
}

function findStudentById(studentId) {
  return students.find((student) => student.id === studentId);
}

// ============================================================
// 4.AVERAGES AND PASS/FAIL
// ============================================================

// Reusable: works for any list of marks.reduce() adds them up,then I divide by how many there are.
// An empty list returns null instead of NaN (0 / 0),so "no marks" is handled on purpose.
function calculateAverage(marks) {
  if (!Array.isArray(marks) || marks.length === 0) {
    return null;
  }
  const total = marks.reduce((sum, mark) => sum + mark, 0);
  return Math.round((total / marks.length) * 10) / 10; // rounded to 1 decimal place
}

// DEFAULT PARAMETER again: the passing mark comes from the config unless I pass a different one.
function determineStatus(average, passingMark = BootcampConfig.getPassingMark()) {
  if (average === null) {
    return "NO MARKS";
  }
  return average >= passingMark ? "PASS" : "FAIL";
}

// ============================================================
// 5.PROCESSING COUNTER (closure)
// ============================================================
// A closure is a function that REMEMBERS the variables from where it was created,
// even after the outer function has finished running.
// processedCount lives inside createProcessingCounter.The only way to touch it is through
// increment() and getCount(),so nothing else in the app can reset or fake the number.
function createProcessingCounter() {
  let processedCount = 0;
  return {
    increment() {
      processedCount++;
      return processedCount;
    },
    getCount() {
      return processedCount;
    },
  };
}
const processingCounter = createProcessingCounter();

// ============================================================
// 6.this,call(),apply() and bind()
// ============================================================

// This function uses "this" but doesn't belong to any object.
// So "this" depends on HOW it's called.call(),apply() and bind() let me choose.
function formatStudentLine(label, symbol) {
  return `${symbol} ${label}: ${this.name} (${this.id},${this.course})`;
}

// Gold-rule student certificate line.Used with call() so one function works for ANY student.
function printCertificateLine() {
  console.log(`  Certificate: ${this.name} completed ${this.course} with an average of ${this.getAverage()}%`);
}

// ============================================================
// 7.FUNCTIONS AS VALUES AND HIGHER-ORDER FUNCTIONS
// ============================================================

// FUNCTIONS AS VALUES: these functions are stored in an object,just like numbers or strings.
// The status is used as the key to pick the right function later.
const statusActions = {
  PASS: (student) => `${student.name} passed.Certificate queued.`,
  FAIL: (student) => `${student.name} did not pass.Support session booked.`,
  "NO MARKS": (student) => `${student.name} has no marks yet.Reminder sent to submit work.`,
};

// HIGHER-ORDER FUNCTION: it takes another function ("action") as an argument and uses it on each student.
function applyToStudents(studentList, action) {
  const results = [];
  for (const student of studentList) {
    results.push(action(student));
  }
  return results;
}

// HIGHER-ORDER FUNCTION that RETURNS a function: makes a reusable filter for any status.
function createStatusFilter(status) {
  return (student) => student.getStatus() === status;
}

// Bonus: search by name (part of a name works,not case sensitive).
function searchStudents(searchText) {
  const query = String(searchText).toLowerCase();
  return students.filter((student) => student.name.toLowerCase().includes(query));
}

// ============================================================
// 8.ASYNC PROCESSING (setTimeout + callbacks)
// ============================================================

// Processes ONE student after a short delay,then hands the result to a CALLBACK.
// The callback decides what happens next.processStudent doesn't need to know.
// The callback follows the common Node style: callback(error,result).
function processStudent(student, onComplete, delayMs = 300) {
  if (!student || typeof student.getStatus !== "function") {
    // Invalid data: report it through the callback instead of crashing.
    // setTimeout 0 keeps it asynchronous,so the callback ALWAYS runs later,never sometimes now and sometimes later.
    setTimeout(() => onComplete(new Error(`Cannot process invalid student data: ${JSON.stringify(student)}`), null), 0);
    return;
  }

  console.log(formatStudentLine.call(student, "Started processing", ">>"));

  setTimeout(() => {
    const processedNumber = processingCounter.increment();
    const result = {
      student,
      average: student.getAverage(),
      status: student.getStatus(),
      processedNumber,
    };
    onComplete(null, result);
  }, delayMs);
}

// Processes a whole list.Each student finishes at a different time (different delays),
// so I count how many callbacks have come back.When ALL are done,onAllDone runs.
function processAllStudents(studentList, onEachDone, onAllDone) {
  let finished = 0;
  studentList.forEach((student, index) => {
    // Staggered delays so the results come back one after another.
    processStudent(
      student,
      (error, result) => {
        onEachDone(error, result);
        finished++;
        if (finished === studentList.length) {
          onAllDone();
        }
      },
      300 + index * 150
    );
  });
}

// ============================================================
// 9.FINAL REPORT
// ============================================================
function printFinalReport() {
  heading("FINAL STUDENT REPORT");
  console.log(`${BootcampConfig.getBootcampName()} | v${BootcampConfig.getVersion()} | Passing mark: ${BootcampConfig.getPassingMark()}%`);
  console.log("");

  const header =
    "ID".padEnd(8) + "Name".padEnd(18) + "Course".padEnd(28) + "Marks".padEnd(20) + "Average".padEnd(9) + "Status";
  console.log(header);
  console.log("-".repeat(header.length + 4));

  for (const student of students) {
    const average = student.getAverage();
    console.log(
      student.id.padEnd(8) +
        student.name.padEnd(18) +
        student.course.padEnd(28) +
        (student.marks.length > 0 ? student.marks.join(",") : "none").padEnd(20) +
        (average === null ? "-" : `${average}%`).padEnd(9) +
        student.getStatus()
    );
  }

  // Class information,all calculated from the data.
  const passed = students.filter(createStatusFilter("PASS")).length;
  const failed = students.filter(createStatusFilter("FAIL")).length;
  const noMarks = students.filter(createStatusFilter("NO MARKS")).length;

  console.log("-".repeat(header.length + 4));
  console.log(`Total students:       ${students.length}`);
  console.log(`Students processed:   ${processingCounter.getCount()}`);
  console.log(`Students who passed:  ${passed}`);
  console.log(`Students who failed:  ${failed}`);
  console.log(`No marks yet:         ${noMarks}`);

  // Bonus statistics
  const studentsWithMarks = students.filter((student) => student.getAverage() !== null);
  const allMarks = studentsWithMarks.flatMap((student) => student.marks);
  const classAverage = calculateAverage(studentsWithMarks.map((student) => student.getAverage()));
  const topStudent = studentsWithMarks.reduce((best, student) => (student.getAverage() > best.getAverage() ? student : best));

  console.log("");
  console.log(`Class average:        ${classAverage}%`);
  console.log(`Highest mark:         ${Math.max(...allMarks)}`);
  console.log(`Lowest mark:          ${Math.min(...allMarks)}`);
  console.log(`Top student:          ${topStudent.name} (${topStudent.getAverage()}%)`);
  return topStudent;
}

// ============================================================
// 10.RUNNING THE APP
// ============================================================
heading(`${BootcampConfig.getBootcampName().toUpperCase()} | STUDENT BOOTCAMP MANAGER v${BootcampConfig.getVersion()}`);

// ---------- DAY 1: register students ----------
heading("DAY 1: REGISTERING STUDENTS");

registerStudent("Sijabulile Ncube", "Full-Stack Web Development", 88, 92, 79, 95);
registerStudent("Bafana Ndlovu", "Data Analytics", 45, 52, 38);
registerStudent("Owethu Jezile", undefined, 67, 71); // undefined -> default course
registerStudent("Mhlengi Ngwenya", "UI/UX Design", 74, 81, 69, 90, 85);
registerStudent("Mandla Junior", "Cloud Computing", 30, 41);
registerStudent("Thami Sithole"); // no course AND no marks: default course,"NO MARKS" status
registerStudent("Bao Kekana", "Data Analytics", 58, "abc", 150, 63); // two invalid marks get ignored
registerStudent("Lesedi Modikwe", "UI/UX Design", 97); // only one mark

// SPREAD: marks from a late assignment arrive as an array and get unpacked into addMarks.
const lateAssignmentMarks = [55, 60];
addMarks("GB-002", ...lateAssignmentMarks);
console.log(`Added late marks ${lateAssignmentMarks.join(",")} to GB-002 using spread.`);

console.log(`\n${students.length} students registered:`);
for (const student of students) {
  // describe() uses "this" to read the student it's called on.
  console.log(`  ${student.describe()} | marks: ${student.marks.length > 0 ? student.marks.join(",") : "none"}`);
}

// ---------- DAY 2: advanced function demos ----------
heading("DAY 2: ADVANCED FUNCTIONS");

// Generator: show that .next() keeps going from where it paused.
const demoIds = studentIdGenerator("DEMO", 98);
console.log(`Generator demo: ${demoIds.next().value},${demoIds.next().value},${demoIds.next().value} (each .next() resumes after the last yield)`);

// IIFE: the passing mark is private.I can't reach it directly,only through the methods.
console.log(`IIFE config: BootcampConfig.passingMark is ${BootcampConfig.passingMark} (private),getPassingMark() is ${BootcampConfig.getPassingMark()}`);
BootcampConfig.setPassingMark(150); // rejected by the validation

// this: inside describe(),"this" is whichever student is to the LEFT of the dot.
const sijabulile = findStudentById("GB-001");
console.log(`this demo: sijabulile.describe() -> ${sijabulile.describe()}`);

// call(): runs the function NOW with "this" set to the student,arguments passed one by one.
console.log(`call() demo: ${formatStudentLine.call(sijabulile,"Welcome","*")}`);
printCertificateLine.call(sijabulile);

// apply(): same as call() but the arguments go in as an ARRAY.
// Practical use: Math.max needs separate numbers,apply() spreads my marks array into it.
const mhlengi = findStudentById("GB-004");
console.log(`apply() demo: ${formatStudentLine.apply(mhlengi,["Highest mark check","*"])}`);
console.log(`  Math.max.apply(null,marks) -> highest mark is ${Math.max.apply(null,mhlengi.marks)}`);

// bind(): doesn't run anything yet.It makes a NEW function with "this" locked to the student,
// which I save and call later (in Day 3,after the async processing finishes).
const congratulateLater = formatStudentLine.bind(mhlengi, "Most improved (sent later with bind)", "*");
console.log("bind() demo: congratulateLater() created now,it will run after processing finishes.");

// Functions as values + higher-order function.
console.log("\nFunctions as values + higher-order function (applyToStudents):");
const actionMessages = applyToStudents(students, (student) => statusActions[student.getStatus()](student));
for (const message of actionMessages) {
  console.log(`  ${message}`);
}

// A higher-order function that returns a function.
const passFilter = createStatusFilter("PASS");
console.log(`Students who pass (createStatusFilter): ${students.filter(passFilter).map((s) => s.name).join(",")}`);

// Bonus: search
console.log(`Search "ng": ${searchStudents("ng").map((s) => s.name).join(",")}`);

// ---------- TESTING: normal and edge cases ----------
heading("TESTS: NORMAL AND EDGE CASES");

function test(description, passed) {
  console.log(`  ${passed ? "PASS" : "FAIL"}  ${description}`);
}

test("Student passes (Sijabulile avg >= 50)", findStudentById("GB-001").getStatus() === "PASS");
test("Student fails (Mandla avg < 50)", findStudentById("GB-005").getStatus() === "FAIL");
test("Student has multiple marks (Mhlengi has 5)", findStudentById("GB-004").marks.length === 5);
test("Default course given when none supplied (Owethu)", findStudentById("GB-003").course === DEFAULT_COURSE);
test("No marks -> average null and status NO MARKS (Thami)", findStudentById("GB-006").getAverage() === null && findStudentById("GB-006").getStatus() === "NO MARKS");
test("Only one mark -> average is that mark (Lesedi = 97)", findStudentById("GB-008").getAverage() === 97);
test("Invalid marks ignored ('abc' and 150 dropped for Bao)", findStudentById("GB-007").marks.join(",") === "58,63");
test("Wrong data type for name is rejected", registerStudent(12345, "Data Analytics", 70) === null);
test("Student that doesn't exist returns undefined", findStudentById("GB-999") === undefined);
test("Passing mark can be changed and changed back", BootcampConfig.setPassingMark(60) && determineStatus(55) === "FAIL" && BootcampConfig.setPassingMark(50) && determineStatus(55) === "PASS");
test("IDs are unique", new Set(students.map((s) => s.id)).size === students.length);

// The last edge case (processing invalid data) is async,so its result shows up in Day 3's output.
console.log("  (Processing invalid data is tested asynchronously in Day 3 below.)");

// ---------- DAY 3: asynchronous processing ----------
heading("DAY 3: ASYNC PROCESSING");

processAllStudents(
  students,
  // Callback for each student: what happens after one is processed.
  (error, result) => {
    if (error) {
      console.log(`  !! ${error.message}`);
      return;
    }
    const { student, average, status, processedNumber } = result;
    console.log(`<< Finished #${processedNumber}: ${student.name} | average ${average === null ? "-" : average + "%"} | ${status}`);
    console.log(`   Next step: ${statusActions[status](student)}`);
  },
  // Callback when EVERY student is done: print the report,then run the bound function.
  () => {
    const topStudent = printFinalReport();
    heading("AFTER THE REPORT");
    console.log(congratulateLater()); // bind() result running later
    printCertificateLine.call(topStudent); // call() reused for the top student
    console.log("\nAll done.Thank you for using the Student Bootcamp Manager.");
  }
);

// Edge case: processing invalid data.The callback receives an error instead of the app crashing.
processStudent(null, (error) => {
  test("Processing invalid data reports an error via the callback", error instanceof Error);
  console.log(`        -> ${error.message}`);
});

// These lines run BEFORE any student finishes,even though they come after processAllStudents in the code.
// setTimeout hands the waiting to the browser/Node and JavaScript carries on with the next lines straight away.
console.log("\n[sync] This message prints BEFORE any student finishes processing.");
console.log("[sync] JavaScript doesn't wait for setTimeout,the callbacks run later from the event loop.\n");
