
/**
 *
 * @param {Function} mainFunction
 * @param {int} delayMs throttle delay in milliseconds
 * @returns
 */
export function throttle(mainFunction, delayMs) {
    let timerFlag = null; // Variable to keep track of the timer

    // Returning a throttled version
    return (...args) => {
        if (timerFlag === null) { // If there is no timer currently running
            // Execute the main function
            mainFunction(...args);
            // Set a timer to clear the timerFlag after the specified delay
            timerFlag = setTimeout(() => {
                // Clear the timerFlag to allow the main function to be executed again
                timerFlag = null;
            }, delayMs);
        }
    };
}

