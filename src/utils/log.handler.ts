class Logger {
    logError(functionName: string, error: Error) {
      console.log(
        `[${new Date().toLocaleString()}] ${functionName} error: ${error.message}`
      );
    }
  
    logMessage(functionName: string, message: string) {
      console.log(
        `[${new Date().toLocaleString()}] ${functionName.padEnd(
          15
        )} : ${message}`
      );
    }
  }
  
  export default new Logger();
  