import mysql from '../database/index'
import { Context, Next } from 'koa'

interface reqMessage  {
    errorType: string;
    data: {
      source?: string;
      lineno?: number;
      colno?: number;
      error?: Error;
      stack?: string;
    };
  }

  export const trackError = async (ctx: Context, next: Next) => {
    const req: reqMessage[] = ctx.request.body
    console.log(req)
    try {
      
    }catch (error) {
      console.log(error)
      throw error 
    }
    await next()
  }