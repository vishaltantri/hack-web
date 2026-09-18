import asyncio
import argparse
from app.core.database import engine, Base
from app.models import *
from app.models.user import User
from app.models.track import Track
from app.models.problem_statement import ProblemStatement
from app.models.panel import Panel
from app.models.event_config import EventConfig
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.security import get_password_hash

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created.")

async def seed_data():
    async with AsyncSessionLocal() as session:
        # Create Admin
        admin = User(
            name="Admin",
            email="admin@vitstudent.ac.in",
            password_hash=get_password_hash("Mann309"),
            role="admin"
        )
        session.add(admin)

        # Create Tracks
        track1 = Track(name="AI and Mathematical Modelling", description="AI and Math")
        track2 = Track(name="Cyber Security", description="Cyber Security")
        session.add_all([track1, track2])
        await session.flush()

        # Create PS
        ps1 = ProblemStatement(track_id=track1.track_id, title="Adaptive Fleet Rerouting", description="Design an adaptive rerouting engine for congested city fleets.")
        ps2 = ProblemStatement(track_id=track1.track_id, title="Industrial IoT Predictive Maintenance System", description="Build an IoT-based predictive maintenance system for industrial equipment.")
        ps3 = ProblemStatement(track_id=track2.track_id, title="Zero-Trust Campus Network", description="Design a zero-trust authentication layer for campus networks.")
        ps4 = ProblemStatement(track_id=track2.track_id, title="Phishing Detection Extension", description="Build a browser extension that detects phishing pages in real time.")
        session.add_all([ps1, ps2, ps3, ps4])

        # Create Panel
        panel = Panel(name="Panel 1", description="Room 101")
        session.add(panel)
        await session.flush()

        # Create Judge
        judge = User(
            name="Judge 1",
            email="judge1@vitstudent.ac.in",
            password_hash=get_password_hash("BhaiYeKyaHoRahaHai"),
            role="judge",
            panel_id=panel.panel_id
        )
        session.add(judge)

        # Event Config
        config = EventConfig(current_phase="Participants Reach")
        session.add(config)

        await session.commit()
    print("Dummy data seeded.")

async def main():
    await init_db()
    await seed_data()

if __name__ == "__main__":
    asyncio.run(main())
