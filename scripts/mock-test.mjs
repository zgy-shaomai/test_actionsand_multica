const shouldFail = process.env.MOCK_TEST_FAIL === "1";

console.log("Running mock test...");

if (shouldFail) {
  console.error("Mock test failed on purpose.");
  process.exit(1);
}

console.log("Mock test passed.");
