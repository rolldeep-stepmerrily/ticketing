/** biome-ignore-all lint/suspicious/noExplicitAny: 사용 */
import { AppException, GLOBAL_ERRORS } from '@@exceptions';

export const CatchDatabaseErrors = () => {
  return (target: any) => {
    const prototype = target.prototype;
    const propertyNames = Object.getOwnPropertyNames(prototype);

    propertyNames.forEach((propertyName) => {
      const descriptor = Object.getOwnPropertyDescriptor(prototype, propertyName);

      if (!descriptor || typeof descriptor.value !== 'function') {
        throw new AppException(GLOBAL_ERRORS.UNKNOWN_ERROR);
      }

      const originalMethod = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        try {
          return await originalMethod.apply(this, args);
        } catch (e) {
          // biome-ignore lint/suspicious/noConsole: 사용
          console.error(e);

          throw new AppException(GLOBAL_ERRORS.DATABASE_ERROR);
        }
      };

      Object.defineProperty(prototype, propertyName, descriptor);
    });
  };
};
