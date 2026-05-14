from typing import List

from sqlmodel import Field, Relationship, SQLModel


class TrainingSkillLink(SQLModel, table=True):
    __tablename__ = "training_skill_link"

    training_id: int = Field(foreign_key="training.id", primary_key=True)
    skill_name: str = Field(foreign_key="skill.name", primary_key=True)


class Skill(SQLModel, table=True):
    __tablename__ = "skill"

    name: str = Field(primary_key=True, index=True)
    trainings: List["Training"] = Relationship(
        back_populates="skills",
        link_model=TrainingSkillLink,
    )


class Training(SQLModel, table=True):
    __tablename__ = "training"

    id: int | None = Field(default=None, primary_key=True)
    title: str
    description: str
    url: str | None = None
    level: str | None = None
    skills: List[Skill] = Relationship(
        back_populates="trainings",
        link_model=TrainingSkillLink,
    )
