import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import listings, actions, stats, scrape
from services.scheduler import start_scheduler, stop_scheduler

# Create tables
Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(
    title="RentSweep API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(listings.router)
app.include_router(actions.router)
app.include_router(stats.router)
app.include_router(scrape.router)


@app.get("/health")
def health():
    return {"status": "ok"}
