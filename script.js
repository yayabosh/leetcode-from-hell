const EDITOR_AREA = document.getElementById('text-editor');         // The text editor
const SUBMIT_BUTTON = document.getElementById('submit');            // The submission button
const TIME_LEFT_LABEL = document.getElementById("time-left");       // The time left label
const TOTAL_TIME_LABEL = document.getElementById("total-time");     // The total elapsped time label
const VERIFICATION_ELEM = document.getElementById("verification");  // The run output area

// Just to debug what test we are running
console.log("Running test: " + SUBMIT_BUTTON.name);

// Map prroblem names to functions
const PROBLEM_MAP = {

  // East tests
  sleepIn: testSleepIn,
  sum: testSum,
  monkeyTrouble: testMonkeyTrouble,
  lastDigit: testLastDigit,
  sortedSearch: testSortedSearch,
  starTriangle: testStarTriangle,

  // Medium tests
  verifyPalindrome: testVerifyPalindrome,
  mergeTwoSortedArrays: testMergeTwoSortedArrays,
  maximumSubarray: testMaximumSubarray,
  reverseInteger: testReverseInteger,
  moveZeroes: testMoveZeroes,
  muchInCommon: testMuchInCommon,

  // Hard tests
  productExceptSelf: testProductExceptSelf,
  murica: testMurica,
  findTheDuplicate: testFindTheDuplicate,
  longestIncreasingSubsequence: testLongestIncreasingSubsequence,
  maximumProduct: testMaximumProduct,
  hardest: testHardest
};

// The maximum time a user has between keypresses, per test
const TIME_MAP = {
  // East tests
  sleepIn: 5000,
  sum: 5000,
  monkeyTrouble: 5000,
  lastDigit: 5000,
  sortedSearch: 5000,
  starTriangle: 5000,

  // Medium tests
  verifyPalindrome: 5000,
  mergeTwoSortedArrays: 5000,
  maximumSubarray: 5000,
  reverseInteger: 5000,
  moveZeroes: 5000,
  muchInCommon: 5000,

  // Hard tests
  productExceptSelf: 10000,
  murica: 10000,
  findTheDuplicate: 10000,
  longestIncreasingSubsequence: 10000,
  maximumProduct: 10000,
  hardest: Infinity
};

const TYPING_TIMEOUT_MILLIS = TIME_MAP[SUBMIT_BUTTON.name]; // Time the user has in between keypresses in milliseconds
TIME_LEFT_LABEL.textContent = (TYPING_TIMEOUT_MILLIS / 1000).toFixed(1); // Set the timer's value
TOTAL_TIME_LABEL.textContent = (0.0).toFixed(1); // Set the total timer's value to 0 on load

// Handles all timing
let globalTimer = null;

let currTime = 0;           // Current time
let startTime = 0;          // Time when the user started coding
let endTime = 0;            // Time when the user stopped coding
let keypressTime = 0;       // Time of last keypress
let pauseKeypress = false;  // Whether the keypress timer is paused

////////////////////////////////////////////////////////////////////
//
// LISTENERS
//
////////////////////////////////////////////////////////////////////

// on keyup, we reset the timeout
EDITOR_AREA.addEventListener('keyup', () => {
  keypressTime = currTime;
})

// Listener for when user types in the text area
EDITOR_AREA.addEventListener('keydown', function (e) {

  // Allow for tabs in the editor
  if (e.key == 'Tab') {
    e.preventDefault();
    var start = this.selectionStart;
    var end = this.selectionEnd;

    // add the indent
    this.value = this.value.substring(0, start) +
      "  " + this.value.substring(end);

    // reset caret to new position after tab
    this.selectionStart =
      this.selectionEnd = start + 2;
  }

  pauseKeypress = false;
  if (!globalTimer) {

    // Timer for everything
    globalTimer = setInterval(() => {
      currTime += 100
      TOTAL_TIME_LABEL.textContent = (currTime / 1000.0).toFixed(1);

      if (pauseKeypress) {
        keypressTime = currTime;
      }

      // Handle the typing timeout
      TIME_LEFT_LABEL.textContent = ((TYPING_TIMEOUT_MILLIS - currTime + keypressTime) / 1000.0).toFixed(1);
      if (currTime - keypressTime === TYPING_TIMEOUT_MILLIS) {
        onTypeFail();
      }
    }, 100);
  }
});

// Listener for when the user clicks the submit buutton
SUBMIT_BUTTON.addEventListener("click", () => {
  endTime = currTime;

  // Reset the output
  VERIFICATION_ELEM.textContent = "";

  // Run the test
  runTest(SUBMIT_BUTTON.name, EDITOR_AREA.value);
});

////////////////////////////////////////////////////////////////////
//
// TOP-LEVEL TEST FUNCTIONS
//
////////////////////////////////////////////////////////////////////

// Assertion for test cases
function assert(expected, funcname, func, ...args) {

  // Convert the arguments into a string
  let argstr = ""
  if (args.length > 0) {
    argstr += valToString(args[0]);

    for (let i = 1; i < args.length; i++) {
      argstr += ", ";
      argstr += valToString(args[i]);
    }
  }

  try {
    const actual = func(...args);

    // Convert expected and actual values into strings
    const expectedstr = valToString(expected);
    const actualstr = valToString(actual);

    // Call if assertion passes
    function pass() {
      VERIFICATION_ELEM.innerHTML += `✅ Passed <code>${funcname}(${argstr})</code>: expected <code>${expectedstr}</code>, got <code>${actualstr}</code><br>`
      return true;
    }

    // Call if assertion fails
    function fail() {
      VERIFICATION_ELEM.innerHTML += `😂 Failed <code>${funcname}(${argstr})</code>: expected <code>${expectedstr}</code>, got <code>${actualstr}</code><br>`
      return false;
    }

    // Perform assertions
    if (isArray(expected)) {
      if (isArray(actual)) {
        if (testArrayEquality(expected, actual)){
          return pass();
        }
      }
    } else if (expected === actual) {
      return pass();
    }
  } catch (err) {
    VERIFICATION_ELEM.innerHTML += `💀 Failed <code>${funcname}(${argstr})</code>: <code>${err}</code><br>`
    return false;
  }

  return fail();
}

// Tries to create a function, returns null on failure
function tryCreateFunction(...args) {
  try {
    parsedFunc = new Function(...args);
    return parsedFunc;
  } catch (err) {
    // Usually a compilation error
    VERIFICATION_ELEM.innerHTML += `💀 Failed: <code>${err}</code><br>`
    return null;
  }
}

////////////////////////////////////////////////////////////////////
//
// HELPER FUNCTIONS
//
////////////////////////////////////////////////////////////////////

// Runs a test asynchronously
function runTest(name, body) {

  // Timeout promise
  const timeout = new Promise((resolve, reject) => {
    let id = setTimeout(() => {
      clearTimeout(id);
      reject("timeout");
    }, 5000);
  })

  // Test promise
  const doTest = new Promise((resolve, reject) => {
    resolve(PROBLEM_MAP[name](body));
  });

  // Merged promise
  const doIt = Promise.race([ timeout, doTest ]);
  
  // Handle completion
  doIt.then(response => {
    if (onTestCompleted(checkArrayPassed(response))) {
      clearInterval(globalTimer);
      globalTimer = null;
    } else {
      pauseKeypress = true;
    }
  });
  
  // Handle timeout
  doIt.catch(error => {
    alert("Execute timed out");
  });
}

// Called when the user fails to type in time
function onTypeFail() {
  // Reset all relevant labels
  EDITOR_AREA.value = '// Your code here ⬇️'
  TOTAL_TIME_LABEL.textContent = "0.0";
  TIME_LEFT_LABEL.textContent = (TYPING_TIMEOUT_MILLIS / 1000.0).toFixed(1);

  clearInterval(globalTimer);
  globalTimer = null;
}

// Called when a test completes
function onTestCompleted(state) {
  if (state) {
    VERIFICATION_ELEM.innerHTML += "<br>🥳 All tests passed!";
  }
  return state;
}

// Checks whether an array "passes", meaning at least on element is true
function checkArrayPassed(arr) {
  if (!arr) return false;
  for (let i = 0; i < arr.length; i++) {
    if (!arr[i]) return false;
  }
  return true;
}

// Converts a value to a string
function valToString(val) {
  if (isArray(val))
    return arrayToString(val);
  else if (val instanceof String || typeof val == 'string')
    return formatString(val);
  else
    return "" + val;
}

// Formats a string, replacing special characters
function formatString(string) {
  let resultstr = "\"";
  for (let i = 0; i < string.length; i++) {
    switch (string[i]) {
      case '\n':
        resultstr += "\\n";
        break;
      case '\r':
        resultstr += "\\r";
        break;
      case '\t':
        resultstr += "\\t";
        break;
      default:
        resultstr += string[i];
        break;
    }
  }
  resultstr += "\"";
  return resultstr;
}


// Recursively converts an array to a string
function arrayToString(array) {
  let result = "["
  if (array.length > 0) {
    result += array[0];
    for (let i = 1; i < array.length; i++) {
      result += ", "
      if (isArray(array[i])) {
        result += arrayToString(array[i]);
      } else if (array[i] instanceof String) {
        result += formatString(array[i]);
      } else {
        result += array[i];
      }
    }
  }
  result += "]";
  return result
}

// Returns whether a value is an array
function isArray(value) {
  return !!value && value.constructor === Array;
}

// Tests array equality
function testArrayEquality(first, second) {
  if (first.length !== second.length) return false;

  for (let i = 0; i < first.length; i++) {
    if (first[i] !== second[i]) return false;
  }

  return true;
}

////////////////////////////////////////////////////////////////////
//
// TESTS
//
////////////////////////////////////////////////////////////////////

// Easy tests

// test sum(a, b)
function testSum(body) {
  let parsedFunc = tryCreateFunction('a', 'b', body);
  if (!parsedFunc) return null;

  const funcname = "sum";

  let list = [];
  list.push(assert(3, funcname, parsedFunc, 1, 2));
  list.push(assert(5, funcname, parsedFunc, 3, 2));
  list.push(assert(4, funcname, parsedFunc, 2, 2));
  list.push(assert(-1, funcname, parsedFunc, -1, 0));
  list.push(assert(6, funcname, parsedFunc, 3, 3));
  list.push(assert(0, funcname, parsedFunc, 0, 0));
  list.push(assert(1, funcname, parsedFunc, 0, 1));
  list.push(assert(7, funcname, parsedFunc, 3, 4));

  return list;
}

// test monkeyTrouble(aSmile, eSmile)
function testMonkeyTrouble(body) {
  let parsedFunc = tryCreateFunction('aSmile', 'eSmile', body);
  if (!parsedFunc) return null;

  const funcname = "monkeyTrouble";

  let list = [];
  list.push(assert(true, funcname, parsedFunc, true, true));
  list.push(assert(true, funcname, parsedFunc, false, false));
  list.push(assert(false, funcname, parsedFunc, true, false));
  list.push(assert(false, funcname, parsedFunc, false, true));

  return list;
}

// test sleepIn(weekday, vacation)
function testSleepIn(body) {
  let parsedFunc = tryCreateFunction('weekday', 'vacation', body);
  if (!parsedFunc) return null;

  const funcname = "sleepIn";

  let list = [];
  list.push(assert(true, funcname, parsedFunc, false, false));
  list.push(assert(false, funcname, parsedFunc, true, false));
  list.push(assert(true, funcname, parsedFunc, false, true));

  return list;
}

// test lastDigit(a, b)
function testLastDigit(body) {
  let parsedFunc = tryCreateFunction('a', 'b', body);
  if (!parsedFunc) return null;

  const funcname = "lastDigit";

  let list = [];
  list.push(assert(true, funcname, parsedFunc, 7, 17));
  list.push(assert(false, funcname, parsedFunc, 6, 17));
  list.push(assert(true, funcname, parsedFunc, 3, 113));
  list.push(assert(false, funcname, parsedFunc, 114, 113));
  list.push(assert(true, funcname, parsedFunc, 114, 4));
  list.push(assert(true, funcname, parsedFunc, 10, 0));
  list.push(assert(false, funcname, parsedFunc, 11, 0));

  return list;
}

// test sortedSearch(nums, target)
function testSortedSearch(body) {
  let parsedFunc = tryCreateFunction('nums', 'target', body);
  if (!parsedFunc) return null;

  const funcname = "sortedSearch";

  let list = [];

  let sorted = [1, 2, 3];
  list.push(assert(2, funcname, parsedFunc, sorted, 3));

  sorted = [6, 9];
  list.push(assert(0, funcname, parsedFunc, sorted, 6));

  sorted = [-5, 0, 9];
  list.push(assert(-1, funcname, parsedFunc, sorted, 420));

  sorted = [-1];
  list.push(assert(-1, funcname, parsedFunc, sorted, 0));

  sorted = [-5, 6, 7];
  list.push(assert(2, funcname, parsedFunc, sorted, 7));

  sorted = [0, 4, 5, 6];
  list.push(assert(2, funcname, parsedFunc, sorted, 5));

  sorted = [];
  list.push(assert(-1, funcname, parsedFunc, sorted, 5));

  return list;
}

// test starTriangle()
function testStarTriangle(body) {
  let parsedFunc = tryCreateFunction(body);
  if (!parsedFunc) return null;

  const funcname = "starTriangle";

  const result = "*\n**\n***\n****\n*****\n";

  let list = [];
  list.push(assert(result, funcname, parsedFunc));

  return list;
}

// Medium tests

function testVerifyPalindrome(body) {
  let parsedFunc = tryCreateFunction('s', body);
  if (!parsedFunc) return null;

  const funcname = "verifyPalindrome";

  let list = [];
  list.push(assert(true, funcname, parsedFunc, "amanaplanacanalpanama"));
  list.push(assert(false, funcname, parsedFunc, "whydoesntthiswork"));
  list.push(assert(false, funcname, parsedFunc, "helloworld"));
  list.push(assert(true, funcname, parsedFunc, "anutforajaroftuna"));
  list.push(assert(true, funcname, parsedFunc, "arewenotpurenosirpanamasmoodynoriegabragsitisgarbageironydoomsamanaprisoneruptonewera"));

  return list;
}

// test mergeTwoSortedArrays()
function testMergeTwoSortedArrays(body) {
  let parsedFunc = tryCreateFunction('a', 'b', 'merged', body);
  if (!parsedFunc) return null;

  const funcname = "merge";
  
  let a, b, n, merged, result;
  let list = [];
  
  a = [ -1, 2, 2, 3 ];
  b = [ 0, 4 ];
  n = a.length + b.length;
  merged = Array(n).fill(0);
  result = [ -1, 0, 2, 2, 3, 4 ];
  list.push(assert(result, funcname, parsedFunc, a, b, merged));

  a = [ 8, 12 ];
  b = [ 6, 10, 14 ];
  n = a.length + b.length;
  merged = Array(n).fill(0);
  result = [ 6, 8, 10, 12, 14 ];
  list.push(assert(result, funcname, parsedFunc, a, b, merged));

  a = [ 1 ];
  b = [ ];
  n = a.length + b.length;
  merged = Array(n).fill(0);
  result = [ 1 ];
  list.push(assert(result, funcname, parsedFunc, a, b, merged));
  return list;
}

// test maximumSubarray()
function testMaximumSubarray(body) {
  let parsedFunc = tryCreateFunction('nums', body);
  if (!parsedFunc) return null;

  const funcname = "maximumSubarray";

  let arr;

  let list = [];

  arr = [ 4, -5, 2, 5 ];
  list.push(assert(7, funcname, parsedFunc, arr));
  
  arr = [ -2, 1, -3, 4, -1, 2, 1, -5, 4 ];
  list.push(assert(6, funcname, parsedFunc, arr));

  arr = [ 6, -5, 2, 5 ];
  list.push(assert(8, funcname, parsedFunc, arr));

  arr = [ -1 ];
  list.push(assert(-1, funcname, parsedFunc, arr));

  arr = [ -4, -3, -2 ];
  list.push(assert(-2, funcname, parsedFunc, arr));

  return list;
}

// test reverseInteger()
function testReverseInteger(body) {
  let parsedFunc = tryCreateFunction('n', body);
  if (!parsedFunc) return null;

  const funcname = "reverseInteger";

  let list = [];

  list.push(assert(321, funcname, parsedFunc, 123));
  list.push(assert(0, funcname, parsedFunc, 0));
  list.push(assert(999666, funcname, parsedFunc, 666999));
  list.push(assert(1337, funcname, parsedFunc, 7331));
  list.push(assert(80085, funcname, parsedFunc, 58008));

  return list;
}

// test moveZeroes()
function testMoveZeroes(body) {
	let parsedFunc = tryCreateFunction('nums', body);
  	if (!parsedFunc) return null;

  	const funcname = "moveZeroes";

    let nums, expected;

  	let list = [];

    nums = [ 0, -1, 0, 3, 12 ];
    expected = [ 0, 0, -1, 3, 12 ];
  	list.push(assert(expected, funcname, parsedFunc, nums));

    nums = [ 1, 2, 3 ];
    expected = [ 1, 2, 3 ];
  	list.push(assert(expected, funcname, parsedFunc, nums));

    nums = [ 0, 0 ];
    expected = [ 0, 0 ];
  	list.push(assert(expected, funcname, parsedFunc, nums));

  	return list;
}

function testMuchInCommon(body) {
  let parsedFunc = tryCreateFunction('a', 'b', body);
  if (!parsedFunc) return null;

  const funcname = "muchInCommon";

  let first, second;

  let list = [];

  first = [ 1, 2, 10 ];
  second = [ 2, 3, 4, 10 ];
  list.push(assert(2, funcname, parsedFunc, first, second));

  first = [ -5, 0, 0, 5 ];
  second = [ 0, 5 ];
  list.push(assert(2, funcname, parsedFunc, first, second));

  first = [ ];
  second = [ 4, 8 ];
  list.push(assert(0, funcname, parsedFunc, first, second));

  first = [ 1, 3, 3 ];
  second = [ 2, 4, 4 ];
  list.push(assert(0, funcname, parsedFunc, first, second));

  first = [ -2, -2 ];
  second = [ -5, -2, 0 ];
  list.push(assert(1, funcname, parsedFunc, first, second));

  return list;
}

// Hard tests

// test productExceptSelf()
function testProductExceptSelf(body) {
	let parsedFunc = tryCreateFunction('nums', body);
  	if (!parsedFunc) return null;

  	const funcname = "productExceptSelf";

    let expected, nums;

  	let list = [];

    nums = [ 1, 2, 3, 4 ];
    expected = [ 24, 12, 8, 6 ];
  	list.push(assert(expected, funcname, parsedFunc, nums));

    nums = [ -1, 1, 0, -3, 3 ];
    expected = [ 0, 0, 9, 0, 0 ];
  	list.push(assert(expected, funcname, parsedFunc, nums));

    nums = [ 1, 2, 1 ];
    expected = [ 2, 1, 2 ];
  	list.push(assert(expected, funcname, parsedFunc, nums));

    nums = [ 4, 5 ];
    expected = [ 5, 4 ];
  	list.push(assert(expected, funcname, parsedFunc, nums));

    nums = [ -4, -2, 2, 4 ];
    expected = [ -16, -32, 32, 16 ];
  	list.push(assert(expected, funcname, parsedFunc, nums));

  	return list;
}

// test murica()
function testMurica(body) {
	let parsedFunc = tryCreateFunction('nums', body);
  if (!parsedFunc) return null;

  const funcname = "murica";

  let nums, expected;

  let list = [];

  nums = [ 2, 0, 2, 1, 1, 0 ];
  expected = [ 0, 0, 1, 1, 2, 2 ];
  list.push(assert(expected, funcname, parsedFunc, nums));

  nums = [ 2, 0, 1 ];
  expected = [ 0, 1, 2 ];
  list.push(assert(expected, funcname, parsedFunc, nums));

  nums = [ 2, 2, 1 ];
  expected = [ 1, 2, 2 ];
  list.push(assert(expected, funcname, parsedFunc, nums));

  nums = [ 1, 1, 0 ];
  expected = [ 0, 1, 1 ];
  list.push(assert(expected, funcname, parsedFunc, nums));

  nums = [ 0 ];
  expected = [ 0 ];
  list.push(assert(expected, funcname, parsedFunc, nums));

  nums = [ 2, 1 ];
  expected = [ 1, 2 ];
  list.push(assert(expected, funcname, parsedFunc, nums));

  return list;
}

// test findTheDuplicate()
function testFindTheDuplicate(body) {
	let parsedFunc = tryCreateFunction('nums', body);
  if (!parsedFunc) return null;

  const funcname = "";

  let nums;

  let list = [];

  nums = [ 1, 3, 4, 2, 2 ];
  list.push(assert(2, funcname, parsedFunc, nums));

  nums = [ 3, 1, 3, 4, 2 ];
  list.push(assert(3, funcname, parsedFunc, nums));

  nums = [ 1, 1 ];
  list.push(assert(1, funcname, parsedFunc, nums));

  nums = [ 1, 1, 2 ];
  list.push(assert(1, funcname, parsedFunc, nums));

  return list;
}

// Test longestIncreasingSubsequence()
function testLongestIncreasingSubsequence(body) {
	let parsedFunc = tryCreateFunction('nums', body);
  if (!parsedFunc) return null;

  const funcname = "LIS";

  let nums;

  let list = [];

  nums = [ 10, 9, 2, 5, 3, 7, 101, 18 ]
  list.push(assert(4, funcname, parsedFunc, nums));

  nums = [ 0, 1, 0, 3, 2, 3 ]
  list.push(assert(4, funcname, parsedFunc, nums));

  nums = [ 7, 7, 7, 7, 7, 7, 7 ]
  list.push(assert(1, funcname, parsedFunc, nums));

  nums = [ 5, 2, 1, 5 ]
  list.push(assert(2, funcname, parsedFunc, nums));

  nums = [ -1, 5, 2, 4, 2, 6 ]
  list.push(assert(4, funcname, parsedFunc, nums));

  return list;
}

// Test maximumProduct()
function testMaximumProduct(body) {
  let parsedFunc = tryCreateFunction('nums', body);
  if (!parsedFunc) return null;

  const funcname = "maximumProduct";

  let nums;

  let list = [];

  nums = [ 2, 3, -2, 4 ]
  list.push(assert(6, funcname, parsedFunc, nums));

  nums = [ -2, 0, -1 ]
  list.push(assert(0, funcname, parsedFunc, nums));

  nums = [ -1, -1, -2, -4 ]
  list.push(assert(8, funcname, parsedFunc, nums));

  nums = [ -2, 1, 2 ]
  list.push(assert(2, funcname, parsedFunc, nums));

  nums = [ -4, -4 ]
  list.push(assert(16, funcname, parsedFunc, nums));

  return list;
}

// Test helloWorld() (rofl) always passes
function testHardest(body) {
  return [ ];
}