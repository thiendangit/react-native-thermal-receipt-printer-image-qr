// @ts-ignore
import Ping from 'react-native-ping';

export const connectToHost = (ipAddress: string, timeout = 4000) => {
  return new Promise(async (resolve, reject) => {
    try {
      /**
       *
       * Get RTT (Round-trip delay time)
       *
       * @static
       * @param {string} ipAddress - For example : 8.8.8.8
       * @param {Object} option - Some optional operations
       * @param {number} option.timeout - timeout
       * @returns
       * @memberof Ping
       */
      await Ping.start(ipAddress, {timeout: timeout});
      resolve(true)
    } catch (error) {
      reject(error)
    }
  })
}
