from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import bcrypt

# --- Import your project's modules ---
from db import get_db
from models import User
from schemas import LoginRequest, SignUpRequest, UserOut # Assuming UserOut exists in schemas
from utils.jwt import create_access_token, verify_token

router = APIRouter()

# This scheme tells FastAPI how to find the token (in the "Authorization" header)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """
    Decodes the JWT token, verifies it, and returns the corresponding User from the database.
    This function is a reusable dependency for protected routes.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = verify_token(token)
    if not payload or "email" not in payload:
        raise credentials_exception
    
    email: str = payload.get("email")
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user


# --- API Routes ---

@router.post("/signup")
def signup(state: SignUpRequest, db: Session = Depends(get_db)):
    # Check if email already exists
    if db.query(User).filter(User.email == state.email).first(): #
        raise HTTPException(status_code=400, detail="Email already registered") #

    # Hash password and create user
    hashed_pw = bcrypt.hashpw(state.password.encode(), bcrypt.gensalt()).decode() #
    new_user = User(
        name=state.name, #
        email=state.email, #
        number=state.number, #
        password=hashed_pw #
    )

    db.add(new_user) #
    db.commit() #

    token = create_access_token({"email": state.email}) #
    return {"message": "Signup successful", "token": token} #


@router.post("/login")
def login(state: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == state.email).first() #

    # Check if user exists and password is correct
    if not user or not bcrypt.checkpw(state.password.encode(), user.password.encode()): #
        raise HTTPException(status_code=401, detail="Invalid email or password") #

    token = create_access_token({"email": state.email}) #
    return {"message": "Login successful", "token": token} #


@router.get("/me", response_model=UserOut)
def get_user_profile(current_user: User = Depends(get_current_user)):
    """
    A protected route that returns the current user's profile.
    The `get_current_user` dependency handles all the token validation.
    """
    return current_user