"""FastAPI application entry point"""

import warnings
warnings.filterwarnings("ignore")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router

app = FastAPI(title="StrideMap API")

app.add_middleware(
    CORSMiddleware,
    # El frontend de Next.js puede arrancar en 3000 o, si está ocupado, en 3001.
    allow_origin_regex=r"http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
