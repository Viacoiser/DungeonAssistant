"""
Logging Configuration - Optimized
- Separate log levels for different modules
- Disable verbose logging in production
- Structured logging for better performance
"""

import logging
import os
from logging.handlers import RotatingFileHandler

def setup_logging():
    """
    Configure logging levels per module
    Reduce I/O overhead by limiting verbose logging in production
    """
    env = os.getenv("ENVIRONMENT", "development")
    
    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO if env == "production" else logging.DEBUG)
    
    # Reduce noise from specific modules in production
    if env == "production":
        logging.getLogger("urllib3").setLevel(logging.WARNING)
        logging.getLogger("httpx").setLevel(logging.WARNING)
        logging.getLogger("socketio").setLevel(logging.WARNING)
        logging.getLogger("engineio").setLevel(logging.WARNING)
        logging.getLogger("supabase").setLevel(logging.WARNING)
        logging.getLogger("postgrest").setLevel(logging.WARNING)
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO if env == "production" else logging.DEBUG)
    
    # Formatter - simplified for production
    if env == "production":
        formatter = logging.Formatter(
            '%(asctime)s | %(name)s | %(levelname)s | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
    else:
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
    
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)
    
    # File handler (only in production)
    if env == "production":
        file_handler = RotatingFileHandler(
            'logs/app.log',
            maxBytes=10_485_760,  # 10 MB
            backupCount=5
        )
        file_handler.setLevel(logging.WARNING)
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)
    
    return root_logger


# Optimized loggers for specific modules
def get_module_logger(module_name, verbose=False):
    """
    Get a logger for a specific module with optimized settings
    """
    logger = logging.getLogger(module_name)
    env = os.getenv("ENVIRONMENT", "development")
    
    if env == "production" and not verbose:
        logger.setLevel(logging.WARNING)
    else:
        logger.setLevel(logging.DEBUG if verbose else logging.INFO)
    
    return logger
