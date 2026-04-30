from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    secret_key: str
    postgres_url: str
    qdrant_host: str = "http://localhost:6333"
    qdrant_collection: str = "resume_vectors2"  
    embedding_dim: int = 1024
    api: str
    api2: str 
    api1: str

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()