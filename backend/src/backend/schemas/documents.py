from pydantic import BaseModel, ConfigDict, Field


class DocumentCreate(BaseModel):
    filename: str = Field(min_length=1, max_length=200)
    path: str = Field(min_length=1, max_length=500)
    course_id: int


class DocumentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    filename: str
    path: str
    course_id: int
