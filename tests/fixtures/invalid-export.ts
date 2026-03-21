// Exports missing required fields — none of these should be loaded as tools

export const missingRun = {
  name: "no-run",
  description: "Has no run function",
};

export const missingName = {
  description: "Has no name",
  run: () => "echo x",
};

export const notAnObject = "just a string";

export default null;
