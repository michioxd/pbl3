using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Logging;

namespace Pbl3.Extensions
{
    public class GlobalExceptionFilter(ILogger<GlobalExceptionFilter> logger) : IExceptionFilter
    {
        private readonly ILogger<GlobalExceptionFilter> _logger = logger;

        public void OnException(ExceptionContext context)
        {
            var exception = context.Exception;
            _logger.LogError(exception, "An unhandled exception occurred during request execution: {Message}", exception.Message);

            var problemDetails = new ProblemDetails
            {
                Instance = context.HttpContext.Request.Path,
                Detail = exception.Message
            };

            int statusCode;

            switch (exception)
            {
                case KeyNotFoundException:
                    statusCode = StatusCodes.Status404NotFound;
                    problemDetails.Title = "Resource Not Found";
                    problemDetails.Status = statusCode;
                    break;

                case InvalidOperationException:
                case ArgumentException:
                    statusCode = StatusCodes.Status400BadRequest;
                    problemDetails.Title = "Bad Request";
                    problemDetails.Status = statusCode;
                    break;

                default:
                    statusCode = StatusCodes.Status500InternalServerError;
                    problemDetails.Title = "An error occurred while processing your request";
                    problemDetails.Status = statusCode;
                    problemDetails.Detail = "Internal Server Error";
                    break;
            }

            context.Result = new ObjectResult(problemDetails)
            {
                StatusCode = statusCode
            };
            context.ExceptionHandled = true;
        }
    }
}
