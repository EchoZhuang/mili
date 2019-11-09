import { Injectable } from '@nestjs/common';
import * as redis from 'redis';
import * as bluebird from 'bluebird';
import * as util from 'util';
import * as _ from 'lodash';
import { User } from '../entity/user.entity';
import { ConfigService } from '../config/config.service';
import { Category } from '../entity/category.entity';

class CacheKeys {
    readonly user: string = 'golang123:user:%d';
    readonly signupCode: string = 'golang123:signupcode:%s';
    readonly userToken: string = 'golang123:usertoken:%d';
    readonly publishArticle: string = 'golang123:publisharticle:%d';
    readonly categories: string = 'golang123:categories';
}

export const cacheKeys: CacheKeys = new CacheKeys();

@Injectable()
export class RedisService {
    readonly originalClient: redis.RedisClient;
    readonly client: any;
    readonly cacheKeys: CacheKeys = new CacheKeys();

    constructor(private readonly configService: ConfigService) {
        const client = redis.createClient(this.configService.redis);
        this.originalClient = client;
        this.client = bluebird.promisifyAll(client);
    }

    async getUser(userID): Promise<User> {
        const cacheKey = util.format(this.cacheKeys.user, userID);
        const userStr = await this.client.getAsync(cacheKey);
        if (!userStr) {
            return null;
        }
        const user = JSON.parse(userStr);
        return user;
    }

    async setUser(user: User) {
        const cacheKey = util.format(this.cacheKeys.user, user.id);
        return await this.client.setAsync(cacheKey, JSON.stringify(user), 'EX', 1 * 60 * 60);
    }

    async setSignupCode(phone: string, code: string) {
        const cacheKey = util.format(this.cacheKeys.signupCode, phone);
        return await this.client.setAsync(cacheKey, code, 'EX', 10 * 60);
    }

    async getSignupCode(phone: string): Promise<string> {
        const cacheKey = util.format(this.cacheKeys.signupCode, phone);
        return await this.client.getAsync(cacheKey);
    }

    async setUserToken(userID: number, token: string) {
        const cacheKey = util.format(this.cacheKeys.userToken, userID);
        const tokenMaxAge: number = this.configService.server.tokenMaxAge;
        return await this.client.setAsync(cacheKey, token, 'EX', Math.floor(tokenMaxAge / 1000));
    }

    async getUserToken(userID: number) {
        const cacheKey = util.format(this.cacheKeys.userToken, userID);
        return await this.client.getAsync(cacheKey);
    }

    async setPublishArticle(userID: number, article) {
        const cacheKey = util.format(this.cacheKeys.publishArticle, userID);
        return await this.client.setAsync(cacheKey, JSON.stringify(article), 'EX', 60 * 60);
    }

    async getCategories(): Promise<Category[]> {
        const str = await this.client.getAsync(this.cacheKeys.categories);
        if (!str) {
            return null;
        }
        return JSON.parse(str);
    }

    async setCategories(categories: Category[]) {
        return await this.client.setAsync(this.cacheKeys.categories, JSON.stringify(categories), 'EX', 1 * 60 * 60);
    }

    async getCache(key: string) {
        return await this.client.getAsync(key);
    }

    async delCache(key: string) {
        return await this.client.delAsync(key);
    }
}