import { SApi, Modularus } from '@scribe-systems/modularus'
import Axios, { AxiosStatic } from 'axios'

import { BrokersApi, CardsApi, ConfigApi, RecordsApi } from './api'
import { Configuration } from './configuration'
import qs from "qs"

declare global {
    interface Window { Modularus: Modularus; }
}

export interface IntegratorAPI {
    usedAxios: AxiosStatic,
    brokers: BrokersApi,
    cards: CardsApi,
    config: ConfigApi,
    records: RecordsApi
}

export default class ModularusIntegratorApi extends SApi {
    loaded = false
    apiClient: IntegratorAPI
    loadedInterceptors: any[] = []

    getApiIdentifier(): String {   
        return "IntegratorAPI"
    }
    async isLoaded(): Promise<boolean> {
        return this.loaded
    }
    async loadApi(baseURL: string): Promise<void> {
        Axios.defaults.paramsSerializer = params => {
            return qs.stringify(params)
        }
        console.log(Axios.defaults)
        const configuration = new Configuration({ basePath: baseURL })

        this.apiClient = {
            usedAxios: Axios,
            brokers: new BrokersApi(configuration, baseURL, Axios),
            cards: new CardsApi(configuration, baseURL, Axios),
            config: new ConfigApi(configuration, baseURL, Axios),
            records: new RecordsApi(configuration, baseURL, Axios)
        } as IntegratorAPI

        this.loaded = true
    }

    async api(): Promise<any> {
        for (let index = 0; index < this.loadedInterceptors.length; index++) {
            const element = this.loadedInterceptors[index];
            this.apiClient?.usedAxios.interceptors.request.eject(element)
        }
        
        for (let index = 0; index < window.Modularus.requestInterceptors.length; index++) {
            const element = window.Modularus.requestInterceptors[index];
            let nr = this.apiClient?.usedAxios.interceptors.request.use(element)
            this.loadedInterceptors.push(nr)
        }
        
        return this.apiClient
    }
}