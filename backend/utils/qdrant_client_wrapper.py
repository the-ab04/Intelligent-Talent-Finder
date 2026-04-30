from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance
from config import settings
from utils.logger import logger

# === Initialize Qdrant Client ===
qdrant_client = QdrantClient(
    url=settings.qdrant_host,
    timeout=30.0,
    # api_key=settings.qdrant_api_key,  # Uncomment when using cloud
)

def setup_qdrant_collection():
    """
    Creates the Qdrant collection if it doesn't exist.
    """
    try:
        if not qdrant_client.collection_exists(settings.qdrant_collection):
            qdrant_client.create_collection(
                collection_name=settings.qdrant_collection,
                vectors_config=VectorParams(
                    size=settings.embedding_dim,
                    distance=Distance.COSINE,
                )
            )
            logger.info(f"✅ Qdrant collection '{settings.qdrant_collection}' created.")
        else:
            logger.info(f"✅ Qdrant collection '{settings.qdrant_collection}' already exists.")
    except Exception as e:
        logger.error(f"❌ Failed to set up Qdrant collection: {e}")
        raise
