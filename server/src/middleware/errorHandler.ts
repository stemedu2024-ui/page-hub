import { Request, Response, NextFunction } from 'express'

export class AppError extends Error {
  statusCode: number
  status: string

  constructor(message: string, statusCode: number = 500) {
    super(message)
    this.statusCode = statusCode
    this.status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error'
    
    Error.captureStackTrace(this, this.constructor)
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500
  const status = err instanceof AppError ? err.status : 'error'
  const message = err.message || 'Internal Server Error'

  console.error('Error:', {
    statusCode,
    status,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  })

  res.status(statusCode).json({
    status,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}
