import request, {
    RequestOptionsInit,
    Canceler,
    RequestMethod,
} from 'umi-request'

const { CancelToken } = request

request.interceptors.request.use((url: string, options: RequestOptionsInit) => {
    if (options.data && options.requestType === 'form')
        options.data = new URLSearchParams(
            Object.entries(options.data).map(([key, value]) => [
                key,
                typeof value === 'object' ? JSON.stringify(value) : value,
            ])
        )
    return { url, options }
})

export default class {
    url: string
    options: RequestOptionsInit
    fetching: boolean
    canceler: Canceler
    onSuccess?: any
    onError?: any

    constructor(url: string, options: RequestOptionsInit = {}) {
        this.url = url
        this.options = options
        this.fetching = false
    }

    fetch(method: RequestMethod, requestType: string) {
        this.getPromise(method, requestType)
            .then(this._dealSuccess.bind(this))
            .catch(this._dealError.bind(this))
        return this
    }

    getPromise(method: RequestMethod, requestType: string) {
        const { token, cancel } = CancelToken.source()
        this.options.method = method
        this.options.requestType = requestType
        this.options.cancelToken = token
        this.canceler = cancel
        this.fetching = true
        return request(this.url, this.options)
    }

    cancel(msg?: string) {
        if (this.canceler && this.fetching) {
            this.fetching = false
            this.canceler(msg)
        }
        return this
    }

    success(onSuccess: any = () => false) {
        this.onSuccess = onSuccess
        return this
    }

    error(onError: any = () => false) {
        this.onError = onError
        return this
    }

    _dealSuccess(data: any) {
        this.fetching = false
        if (this.onSuccess) this.onSuccess(data)
    }

    _dealError(error: any) {
        this.fetching = false
        console.error(error, this.options)
        if (this.onError) this.onError(error, this.options)
    }
}