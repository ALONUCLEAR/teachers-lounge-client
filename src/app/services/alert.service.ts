export type BaseStatus = 'error' | 'warning' | 'success' | 'info';

export abstract class AlertService<Options extends Record<string, any>, Status extends BaseStatus = BaseStatus, AlertResult = void> {
    protected defaultOptions: Options = {} as Options;

    protected getOptions(options?: Options): Options {
        if (!options) {
            return this.defaultOptions;
        }

        return { ...this.defaultOptions, ...options };
    };

    protected abstract alert(text: string, status: Status, options?: Options): AlertResult;

    info(text: string, options?: Options): AlertResult {
      return this.alert(text, 'info' as Status, options);
    }
  
    success(text: string, options?: Options): AlertResult {
      return this.alert(text, 'success' as Status, options);
    }

    error(text: string, options?: Options): AlertResult {
      return this.alert(text, 'error' as Status, options);
    }

    warn(text: string, options?: Options): AlertResult {
      return this.alert(text, 'warning' as Status, options);
    }
}
