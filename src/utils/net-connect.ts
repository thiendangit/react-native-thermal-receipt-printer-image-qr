export const connectToHost = (ipAddress: string, _timeout = 4000) => {
	return new Promise((resolve, reject) => {
		// Simple IP address validation - the actual connection will be
		// established by the native printer module
		if (ipAddress && ipAddress.match(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/)) {
			resolve(true);
		} else {
			reject(new Error("Invalid IP address"));
		}
	});
};
