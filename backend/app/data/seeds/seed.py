import random
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from faker import Faker
from sqlmodel import Session, delete
from app.models.training import Skill, Training, TrainingSkillLink
import sys; sys.stdout.flush()

from app.database import engine, create_db_and_tables
from app.models import (
    Dealership,
    Department,
    Product,
    Vehicle,
    Service,
    Upgrade,
    AppUser,
    UserSkill,
    UserAlert,
    RewardCatalog,
    RewardRedemption,
    SaleTransaction,
    SaleTransactionItem,
)

SEED = 42
fake = Faker()
random.seed(SEED)
Faker.seed(SEED)

TARGET_DEALERSHIPS = 20
TARGET_DEPARTMENTS = 60
TARGET_USERS = 500
TARGET_PRODUCTS = 200
TARGET_VEHICLES = 100
TARGET_SERVICES = 60
TARGET_UPGRADES = 40
TARGET_TRANSACTIONS = 1000
TARGET_TRANSACTION_ITEMS = 2500
TARGET_ALERTS = 500
TARGET_REDEMPTIONS = 300
FORECAST_RECENT_PERIODS_PER_ACTIVE_ADVISOR = 3

ROLES = ["manager", "sales_advisor"]
DEPARTMENTS = ["Sales", "Service", "Finance"]
REGIONS = ["North", "South", "East", "West", "Central"]

SKILLS = [
    "Negotiation",
    "Customer Communication",
    "Product Knowledge",
    "Closing Deals",
    "Upselling",
    "Cross-selling",
    "CRM Usage",
    "Lead Management",
    "After Sales Support",
    "Time Management",
    "Problem Solving",
    "Objection Handling",
    "Customer Retention",
    "Vehicle Financing Basics",
    "Service Package Knowledge",
]

SKILL_LEVELS = ["beginner", "intermediate", "advanced"]

# Alert taxonomy tuned to app domains
# - sales_milestone: sales/points milestones and wins
# - lead: customer follow‑ups or new opportunities
# - reward: catalog unlocks and redemptions
# - performance: rank/KPI nudges and coaching tips
# - leaderboard: position changes within dealership
# - system: neutral system/app notices
ALERT_TYPES = ["sales_milestone", "lead", "reward", "performance", "leaderboard", "system"]
ALERT_PRIORITIES = ["low", "medium", "high"]

REWARDS = [
    ("Amazon Gift Card", "Gift card for online shopping", 100),
    ("Fuel Voucher", "Voucher for fuel expenses", 150),
    ("Restaurant Voucher", "Dinner voucher reward", 200),
    ("Electronics Discount", "Discount for electronics purchase", 300),
    ("Weekend Experience", "Experience package for top performers", 500),
    ("Car Accessories Voucher", "Voucher for vehicle accessories", 250),
]

VEHICLES = [
    ("Volkswagen", "Golf", "Life", 25000),
    ("Volkswagen", "Golf", "Style", 28000),
    ("Volkswagen", "Golf", "R-Line", 32000),
    ("Volkswagen", "Polo", "Life", 18000),
    ("Volkswagen", "Polo", "Style", 21000),
    ("Volkswagen", "Passat", "Elegance", 36000),
    ("Volkswagen", "Passat", "R-Line", 42000),
    ("Volkswagen", "Tiguan", "Life", 35000),
    ("Volkswagen", "Tiguan", "Elegance", 41000),
    ("Volkswagen", "Touareg", "Elegance", 62000),
    ("Volkswagen", "T-Roc", "Life", 27000),
    ("Volkswagen", "T-Roc", "R-Line", 33000),
    ("Volkswagen", "ID.3", "Pro", 37000),
    ("Volkswagen", "ID.4", "Pro", 46000),
]

SERVICES = [
    ("insurance", "Basic Insurance", 500, 12, "Volkswagen Insurance"),
    ("insurance", "Premium Insurance", 1200, 12, "Volkswagen Insurance"),
    ("maintenance", "Annual Maintenance", 300, 12, "Volkswagen Service Center"),
    ("maintenance", "Full Maintenance Package", 800, 24, "Volkswagen Service Center"),
    ("warranty", "Extended Warranty", 1500, 36, "Volkswagen Warranty Center"),
    ("roadside", "Roadside Assistance", 200, 12, "Volkswagen Assistance"),
    ("inspection", "Technical Inspection", 150, 6, "Volkswagen Service Center"),
    ("care", "Interior Care Package", 250, 12, "Volkswagen Care"),
]

UPGRADES_BY_CATEGORY = {
    "comfort": [
        ("Heated Seats", 600),
        ("Ventilated Seats", 800),
        ("Ambient Interior Lighting", 350),
        ("Premium Armrest Package", 300),
    ],
    "technology": [
        ("Touchscreen Display Upgrade", 900),
        ("Navigation System", 700),
        ("Digital Dashboard", 1000),
        ("Wireless Charging Pad", 250),
    ],
    "safety": [
        ("Parking Sensors", 400),
        ("Rear Camera", 500),
        ("Blind Spot Assist", 750),
        ("Lane Assist Package", 850),
    ],
    "performance": [
        ("Sport Suspension", 1200),
        ("Engine Tuning Package", 1500),
        ("Performance Brake Kit", 1300),
    ],
    "exterior": [
        ("Alloy Wheels Upgrade", 1000),
        ("Roof Rails", 450),
        ("Sport Body Kit", 1600),
    ],
}

TRANSACTION_STATUSES = ["completed", "completed", "completed", "cancelled"]
REDEMPTION_STATUSES = ["requested", "approved", "completed"]


def calculate_rank(points: int) -> str:
    if points < 500:
        return "Default"
    if points < 1000:
        return "Bronze"
    if points < 2000:
        return "Silver"
    return "Gold"


def calculate_credit(points: int) -> float:
    return round(points * 0.1, 2)


def clear_data(session: Session) -> None:
    for model in [
        TrainingSkillLink,
        Training,
        Skill,
        RewardRedemption,
        UserAlert,
        UserSkill,
        SaleTransactionItem,
        SaleTransaction,
        AppUser,
        Department,
        Vehicle,
        Service,
        Upgrade,
        Product,
        RewardCatalog,
        Dealership,
    ]:
        session.exec(delete(model))
    session.commit()


def create_dealerships(session: Session):
    dealerships = []

    for i in range(TARGET_DEALERSHIPS):
        city = fake.city()
        dealership = Dealership(
            name=f"Volkswagen {city} Autohaus",
            dealer_code=f"VW-{i + 1:03}",
            city=city,
            country="Romania",
            region=random.choice(REGIONS),
        )
        session.add(dealership)
        dealerships.append(dealership)

    session.commit()

    for dealership in dealerships:
        session.refresh(dealership)

    return dealerships


def create_departments(session: Session, dealerships):
    departments = []

    for dealership in dealerships:
        for department_name in DEPARTMENTS:
            department = Department(
                dealership_id=dealership.dealership_id,
                name=department_name,
            )
            session.add(department)
            departments.append(department)

    session.commit()

    for department in departments:
        session.refresh(department)

    assert len(departments) == TARGET_DEPARTMENTS

    return departments


def create_products(session: Session):
    products = []
    vehicle_products = []
    service_products = []
    upgrade_products = []

    for _ in range(TARGET_VEHICLES):
        brand, model, trim, price = random.choice(VEHICLES)

        product = Product(
            item_type="vehicle",
            name=f"{brand} {model} {trim}",
            description=f"{brand} {model} {trim} vehicle",
            price=float(price),
            points_value=int(price / 100),
        )

        session.add(product)
        products.append(product)
        vehicle_products.append((product, brand, model, trim))

    for _ in range(TARGET_SERVICES):
        service_type, name, price, duration_months, provider = random.choice(SERVICES)

        product = Product(
            item_type="service",
            name=name,
            description=f"{name} service package for Volkswagen customers",
            price=float(price),
            points_value=max(10, int(price / 10)),
        )

        session.add(product)
        products.append(product)
        service_products.append((product, service_type, duration_months, provider))

    upgrade_categories = list(UPGRADES_BY_CATEGORY.keys())

    for _ in range(TARGET_UPGRADES):
        category = random.choice(upgrade_categories)
        name, price = random.choice(UPGRADES_BY_CATEGORY[category])

        product = Product(
            item_type="upgrade",
            name=name,
            description=f"{name} upgrade for Volkswagen vehicles",
            price=float(price),
            points_value=max(10, int(price / 10)),
        )

        session.add(product)
        products.append(product)
        upgrade_products.append((product, category))

    session.commit()

    for product in products:
        session.refresh(product)

    for product, brand, model, trim in vehicle_products:
        vehicle = Vehicle(
            product_id=product.product_id,
            brand=brand,
            model=model,
            trim_name=trim,
            model_year=random.choice([2022, 2023, 2024, 2025]),
            fuel_type=random.choice(["Petrol", "Diesel", "Hybrid", "Electric"]),
            body_type=random.choice(["Hatchback", "Sedan", "SUV"]),
            transmission=random.choice(["Manual", "Automatic"]),
        )
        session.add(vehicle)

    for product, service_type, duration_months, provider in service_products:
        service = Service(
            product_id=product.product_id,
            service_type=service_type,
            duration_months=duration_months,
            provider_name=provider,
            renewable=True,
        )
        session.add(service)

    for product, category in upgrade_products:
        upgrade = Upgrade(
            product_id=product.product_id,
            upgrade_type=category,
            brand_scope="Volkswagen",
            installation_required=True,
        )
        session.add(upgrade)

    session.commit()

    assert len(products) == TARGET_PRODUCTS

    return products


def create_users(session: Session, dealerships, departments):
    users = []
    departments_by_dealership = {}

    for department in departments:
        departments_by_dealership.setdefault(department.dealership_id, []).append(department)

    managers_by_dealership = {}

    for dealership in dealerships:
        sales_department = next(
            department
            for department in departments_by_dealership[dealership.dealership_id]
            if department.name == "Sales"
        )

        points = random.randint(2000, 7000)
        manager = AppUser(
            dealership_id=dealership.dealership_id,
            department_id=sales_department.department_id,
            manager_user_id=None,
            role="manager",
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            email=f"manager{dealership.dealership_id}@championsclub.demo",
            password="manager123",
            phone=fake.phone_number(),
            employee_number=f"MGR{dealership.dealership_id:04}",
            rank=calculate_rank(points),
            points=points,
            credit=calculate_credit(points),
            hire_date=fake.date_between(start_date="-6y", end_date="-2y"),
            status="active",
            last_login_at=fake.date_time_between(start_date="-14d", end_date="now"),
        )

        session.add(manager)
        users.append(manager)
        managers_by_dealership[dealership.dealership_id] = manager

    session.commit()

    for user in users:
        session.refresh(user)

    for i in range(TARGET_USERS - len(users)):
        dealership = random.choice(dealerships)
        dealership_departments = departments_by_dealership[dealership.dealership_id]
        department = random.choice(dealership_departments)
        manager = managers_by_dealership[dealership.dealership_id]

        points = random.randint(0, 5000)

        first_name = fake.first_name()
        last_name = fake.last_name()

        user = AppUser(
            dealership_id=dealership.dealership_id,
            department_id=department.department_id,
            manager_user_id=manager.user_id,
            role="sales_advisor",
            first_name=first_name,
            last_name=last_name,
            email=f"user{i + 1}@championsclub.demo",
            password="advisor123",
            phone=fake.phone_number(),
            employee_number=f"EMP{i + 1:04}",
            rank=calculate_rank(points),
            points=points,
            credit=calculate_credit(points),
            hire_date=fake.date_between(start_date="-5y", end_date="-3m"),
            status=random.choice(["active", "active", "active", "inactive"]),
            last_login_at=fake.date_time_between(start_date="-30d", end_date="now"),
        )

        session.add(user)
        users.append(user)

    session.commit()

    for user in users:
        session.refresh(user)

    assert len(users) == TARGET_USERS

    return users


def create_user_skills(session: Session, users):
    for user in users:
        if user.role == "manager":
            skills_count = random.randint(5, 9)
        else:
            skills_count = random.randint(4, 7)

        chosen_skills = random.sample(SKILLS, k=skills_count)

        for skill in chosen_skills:
            user_skill = UserSkill(
                user_id=user.user_id,
                skill_name=skill,
                skill_level=random.choice(SKILL_LEVELS),
                verified=random.choice([True, False]),
                updated_at=fake.date_time_between(start_date="-1y", end_date="now"),
            )
            session.add(user_skill)

    session.commit()


def _next_rank_threshold(points: int) -> Tuple[str, int]:
    thresholds = [("Default", 0), ("Bronze", 500), ("Silver", 1000), ("Gold", 2000)]
    for name, th in thresholds:
        if points < th:
            return (name, th)
    return ("Gold", 2000)


def _dealership_leaderboard(users: List[AppUser]) -> Dict[int, List[AppUser]]:
    by_dealer: Dict[int, List[AppUser]] = {}
    for u in users:
        by_dealer.setdefault(u.dealership_id, []).append(u)
    for dealer_id, lst in by_dealer.items():
        by_dealer[dealer_id] = sorted(lst, key=lambda x: x.points, reverse=True)
    return by_dealer


def _choose_vehicle_product(products: List[Product]) -> Product | None:
    vehicles = [p for p in products if getattr(p, "item_type", None) == "vehicle"]
    return random.choice(vehicles) if vehicles else None


def _affordable_rewards(user: AppUser, rewards: List[RewardCatalog]) -> List[RewardCatalog]:
    return [r for r in rewards if r.credit_cost <= user.credit]


def _gen_alert_for_user(
    user: AppUser,
    products: List[Product],
    rewards: List[RewardCatalog],
    dealer_boards: Dict[int, List[AppUser]],
    last_completed_tx_at: Optional[datetime] = None,
) -> Tuple[str, str, str]:
    """Return (alert_type, title, message) for a contextual alert."""
    # Role-aware weighting: managers receive fewer personal alerts; feed is built from team
    base_weights = [25, 18, 18, 18, 16, 5]  # sales_milestone, lead, reward, performance, leaderboard, system
    if user.role == "manager":
        base_weights = [5, 5, 5, 10, 5, 70]  # mostly neutral/system if manager has alerts

    alert_type = random.choices(
        ALERT_TYPES,
        weights=base_weights,  # bias based on role
        k=1,
    )[0]

    # Defaults
    title = "Notification"
    message = fake.sentence(nb_words=12)

    # Manager-relevant conditions for sales advisors
    if user.role != "manager":
        now_time = datetime.utcnow()
        # Stale login
        if user.last_login_at and (now_time - user.last_login_at).days >= 14:
            alert_type = "performance"
            title = "Low activity notice"
            message = (
                f"You haven't logged in since {user.last_login_at.strftime('%b %d')}. "
                f"Review your leads and update pipeline."
            )
            return alert_type, title, message

        # Stale pipeline (no completed transactions recently)
        if last_completed_tx_at is None or (now_time - last_completed_tx_at).days >= 30:
            if random.random() < 0.4:  # not for everyone, some randomness
                alert_type = "performance"
                title = "Pipeline at risk"
                when = last_completed_tx_at.strftime('%b %d') if last_completed_tx_at else "over a month"
                message = (
                    f"No completed transactions in the last 30d (last: {when}). "
                    f"Schedule follow-ups and book demos."
                )
                return alert_type, title, message

    if alert_type == "sales_milestone":
        next_rank, th = _next_rank_threshold(user.points)
        gap = max(0, th - user.points)
        if gap == 0 and user.rank in ("Bronze", "Silver", "Gold"):
            title = "Monthly target reached"
            message = (
                f"Great job, {user.first_name}! You reached the {user.rank} tier with "
                f"{user.points} pts. Keep the momentum!"
            )
        else:
            title = "Milestone in sight"
            message = (
                f"Only {gap} pts to hit {next_rank}. A couple of {random.choice(['test drives','upsells','service packages'])} "
                f"could get you there. Current: {user.points} pts."
            )

    elif alert_type == "lead":
        customer = f"{fake.first_name()} {fake.last_name()}"
        when = fake.date_time_between(start_date="-5d", end_date="+3d").strftime("%b %d, %H:%M")
        vehicle = _choose_vehicle_product(products)
        vehicle_name = vehicle.name if vehicle else random.choice(["Golf Life", "Tiguan Elegance", "ID.4 Pro"])
        title = random.choice(["Customer follow-up reminder", "New lead assigned", "Test drive follow-up"])
        message = (
            f"Follow up with {customer} about the {vehicle_name}. Suggested time: {when}. "
            f"Tip: mention financing options and trade‑in."
        )

    elif alert_type == "reward":
        affordable = _affordable_rewards(user, rewards)
        if affordable:
            reward = random.choice(affordable)
            title = random.choice(["Reward unlocked", "New reward available"]) 
            message = (
                f"You can redeem '{reward.name}' for {int(reward.credit_cost)} credits. "
                f"Balance: {int(user.credit)}."
            )
        else:
            new_reward = random.choice(rewards) if rewards else None
            title = "Reward redemption update" if random.random() < 0.5 else "New catalog item"
            if new_reward:
                message = (
                    f"'{new_reward.name}' added to the catalog. Earn {int(new_reward.credit_cost)} credits to redeem."
                )
            else:
                message = "New rewards available soon. Keep earning points!"

    elif alert_type == "performance":
        skill = random.choice(SKILLS)
        delta = random.choice(["up", "down"]) 
        pct = random.choice([3, 4, 5, 6, 7])
        title = "Performance update"
        message = (
            f"Your {skill.lower()} trend is {delta} {pct}%. Current rank: {user.rank}. "
            f"Focus on {random.choice(['closing techniques','qualification','demo flow','objection handling'])}."
        )

    elif alert_type == "leaderboard":
        board = dealer_boards.get(user.dealership_id, [])
        pos = board.index(user) + 1 if user in board else random.randint(1, max(1, len(board)))
        percentile = int((pos / max(1, len(board))) * 100)
        moved = random.choice(["up", "down"]) if pos > 1 else "up"
        title = "Leaderboard position changed"
        message = (
            f"You're now #{pos} in your dealership (top {percentile}%). "
            f"Position moved {moved}. Points: {user.points}."
        )

    elif alert_type == "system":
        title = random.choice(["System maintenance", "Profile updated", "New app version"])
        message = random.choice([
            "Scheduled maintenance tonight 23:00–23:30. No action required.",
            "Your profile was updated successfully.",
            "A new version of Champions Club is available.",
        ])

    return alert_type, title, message


def create_alerts(
    session: Session,
    users: List[AppUser],
    products: List[Product],
    rewards: List[RewardCatalog],
    transactions: List[SaleTransaction],
):
    dealer_boards = _dealership_leaderboard(users)

    # Latest completed transaction per user
    last_tx_by_user: Dict[int, Optional[datetime]] = {}
    for tx in transactions:
        if getattr(tx, "status", None) == "completed":
            cur = last_tx_by_user.get(tx.user_id)
            if cur is None or tx.transaction_date > cur:
                last_tx_by_user[tx.user_id] = tx.transaction_date

    for _ in range(TARGET_ALERTS):
        user = random.choice(users)
        alert_type, title, message = _gen_alert_for_user(
            user,
            products,
            rewards,
            dealer_boards,
            last_completed_tx_at=last_tx_by_user.get(user.user_id),
        )

        # Priority heuristics per type/content
        if alert_type in ("sales_milestone", "leaderboard") and ("reached" in title or "#1" in message):
            priority = "high"
        elif alert_type in ("lead", "reward"):
            priority = random.choice(["medium", "high"]) if alert_type == "lead" else random.choice(["low", "medium"]) 
        elif alert_type == "system":
            priority = "low"
        else:
            priority = random.choice(ALERT_PRIORITIES)

        alert = UserAlert(
            user_id=user.user_id,
            alert_type=alert_type,
            title=title,
            message=message,
            priority=priority,
            is_read=random.choice([True, False]),
            created_at=fake.date_time_between(start_date="-90d", end_date="now"),
        )
        session.add(alert)

    session.commit()


def create_rewards(session: Session):
    rewards = []

    for name, description, cost in REWARDS:
        reward = RewardCatalog(
            name=name,
            description=description,
            credit_cost=float(cost),
            is_active=True,
            stock_quantity=int((len(rewards) + 1) * 7 % 20),
        )
        session.add(reward)
        rewards.append(reward)

    session.commit()

    for reward in rewards:
        session.refresh(reward)

    return rewards


def create_transactions(session: Session, users, products):
    transactions = []

    active_users = [user for user in users if user.status == "active"]

    for _ in range(TARGET_TRANSACTIONS):
        user = random.choice(active_users)

        transaction = SaleTransaction(
            dealership_id=user.dealership_id,
            user_id=user.user_id,
            transaction_date=fake.date_time_between(start_date="-1y", end_date="now"),
            amount=0.0,
            points_earned=0,
            status=random.choice(TRANSACTION_STATUSES),
        )

        session.add(transaction)
        transactions.append(transaction)

    session.commit()

    for transaction in transactions:
        session.refresh(transaction)

    vehicles = [product for product in products if product.item_type == "vehicle"]
    services = [product for product in products if product.item_type == "service"]
    upgrades = [product for product in products if product.item_type == "upgrade"]

    transaction_items_created = 0

    for index, transaction in enumerate(transactions):
        remaining_transactions = TARGET_TRANSACTIONS - index
        remaining_items = TARGET_TRANSACTION_ITEMS - transaction_items_created

        if remaining_transactions == 1:
            items_count = remaining_items
        else:
            min_needed_after = remaining_transactions - 1
            max_for_this = min(4, remaining_items - min_needed_after)
            items_count = random.randint(1, max_for_this)

        chosen_products = []

        if random.random() < 0.65 and vehicles:
            chosen_products.append(random.choice(vehicles))

        while len(chosen_products) < items_count:
            product_pool = random.choice([services, upgrades, products])
            chosen_products.append(random.choice(product_pool))

        total_amount = 0.0
        total_points = 0

        for product in chosen_products:
            item = SaleTransactionItem(
                transaction_id=transaction.transaction_id,
                product_id=product.product_id,
                quantity=1,
            )
            session.add(item)

            total_amount += product.price
            total_points += product.points_value
            transaction_items_created += 1

        transaction.amount = total_amount
        transaction.points_earned = total_points

    session.commit()

    assert len(transactions) == TARGET_TRANSACTIONS
    assert transaction_items_created == TARGET_TRANSACTION_ITEMS

    return transactions


def create_forecast_support_transactions(session: Session, users, products):
    transactions = []
    active_advisors = [
        user
        for user in users
        if user.role == "sales_advisor" and user.status == "active"
    ]

    vehicles = [product for product in products if product.item_type == "vehicle"]
    services = [product for product in products if product.item_type == "service"]
    upgrades = [product for product in products if product.item_type == "upgrade"]

    forecast_windows = [
        ("-85d", "-65d"),
        ("-55d", "-35d"),
        ("-20d", "-3d"),
    ][:FORECAST_RECENT_PERIODS_PER_ACTIVE_ADVISOR]

    for user in active_advisors:
        for start_date, end_date in forecast_windows:
            transaction = SaleTransaction(
                dealership_id=user.dealership_id,
                user_id=user.user_id,
                transaction_date=fake.date_time_between(
                    start_date=start_date,
                    end_date=end_date,
                ),
                amount=0.0,
                points_earned=0,
                status="completed",
            )
            session.add(transaction)
            session.flush()

            chosen_products = []
            if vehicles and random.random() < 0.55:
                chosen_products.append(random.choice(vehicles))
            else:
                base_pool = services + upgrades + products
                if base_pool:
                    chosen_products.append(random.choice(base_pool))

            addon_pool = services + upgrades
            for _ in range(random.randint(0, 2)):
                if addon_pool:
                    chosen_products.append(random.choice(addon_pool))

            total_amount = 0.0
            total_points = 0

            for product in chosen_products:
                session.add(
                    SaleTransactionItem(
                        transaction_id=transaction.transaction_id,
                        product_id=product.product_id,
                        quantity=1,
                    )
                )
                total_amount += product.price
                total_points += product.points_value

            transaction.amount = total_amount
            transaction.points_earned = total_points
            transactions.append(transaction)

    session.commit()

    for transaction in transactions:
        session.refresh(transaction)

    return transactions


def update_user_points_and_credit_from_transactions(session: Session, users, transactions):
    points_by_user_id = {user.user_id: 0 for user in users}

    for transaction in transactions:
        if transaction.status == "completed":
            points_by_user_id[transaction.user_id] += transaction.points_earned

    for user in users:
        user.points = points_by_user_id.get(user.user_id, 0)
        user.rank = calculate_rank(user.points)
        user.credit = calculate_credit(user.points)

    session.commit()


def create_reward_redemptions(session: Session, users, rewards):
    eligible_users = [user for user in users if user.credit >= min(reward.credit_cost for reward in rewards)]

    for _ in range(TARGET_REDEMPTIONS):
        if not eligible_users:
            break

        user = random.choice(eligible_users)
        affordable_rewards = [
            reward for reward in rewards
            if reward.credit_cost <= user.credit
        ]

        if not affordable_rewards:
            eligible_users.remove(user)
            continue

        reward = random.choice(affordable_rewards)

        redemption = RewardRedemption(
            user_id=user.user_id,
            reward_id=reward.reward_id,
            credit_spent=reward.credit_cost,
            status=random.choice(REDEMPTION_STATUSES),
            requested_at=fake.date_time_between(start_date="-6m", end_date="now"),
        )

        user.credit = round(user.credit - reward.credit_cost, 2)
        session.add(redemption)

    session.commit()


def create_manager_alerts(
    session: Session,
    users: List[AppUser],
    rewards: List[RewardCatalog],
    transactions: List[SaleTransaction],
):
    now = datetime.utcnow()
    last_7 = now - timedelta(days=7)
    prev_7_start = now - timedelta(days=14)
    last_30 = now - timedelta(days=30)

    team_by_manager: Dict[int, List[AppUser]] = {}
    for u in users:
        if u.manager_user_id is not None:
            team_by_manager.setdefault(u.manager_user_id, []).append(u)

    tx_by_user: Dict[int, List[SaleTransaction]] = {}
    for tx in transactions:
        if getattr(tx, "status", None) == "completed":
            tx_by_user.setdefault(tx.user_id, []).append(tx)

    min_reward_cost = min((r.credit_cost for r in rewards), default=999999)

    def affordable_rewards_count(u: AppUser) -> int:
        return 1 if u.credit >= min_reward_cost else 0

    created = 0

    for manager in users:
        if manager.role != "manager":
            continue

        team = team_by_manager.get(manager.user_id, [])
        if not team:
            continue

        active_team = [m for m in team if m.status == "active"]
        team_ids = {m.user_id for m in active_team}

        team_points_total = sum(m.points for m in active_team) if active_team else 0
        team_points_avg = int(team_points_total / len(active_team)) if active_team else 0

        top_member = max(active_team, key=lambda m: m.points, default=None)
        bottom_member = min(active_team, key=lambda m: m.points, default=None)

        # Transactions windows
        last7_points = 0
        prev7_points = 0
        last30_completed = 0
        for uid in team_ids:
            for tx in tx_by_user.get(uid, []):
                if tx.transaction_date >= last_7:
                    last7_points += tx.points_earned
                elif prev_7_start <= tx.transaction_date < last_7:
                    prev7_points += tx.points_earned
                if tx.transaction_date >= last_30:
                    last30_completed += 1

        trend_delta_pct: Optional[int] = None
        trend_dir = "flat"
        if prev7_points > 0:
            pct = round(((last7_points - prev7_points) / prev7_points) * 100)
            trend_delta_pct = abs(pct)
            trend_dir = "up" if pct > 0 else ("down" if pct < 0 else "flat")
        elif last7_points > 0:
            trend_delta_pct = 100
            trend_dir = "up"

        # Stale activity: members with no completed tx in last 30d or stale login
        stale_login_count = sum(
            1
            for m in active_team
            if (m.last_login_at is None) or ((now - m.last_login_at).days >= 14)
        )
        no_tx_last30 = sum(
            1
            for m in active_team
            if all((t.transaction_date < last_30) for t in tx_by_user.get(m.user_id, []))
        )

        rewards_ready = sum(affordable_rewards_count(m) for m in active_team)

        # 1) Team momentum insight
        title = (
            f"Team momentum {trend_dir} {trend_delta_pct}%"
            if trend_delta_pct is not None
            else "Team momentum update"
        )
        message = (
            f"Last 7d earned {last7_points} pts vs prev 7d {prev7_points}. "
            f"Avg per rep: {team_points_avg}."
        )
        priority = "medium" if trend_dir != "down" else ("high" if (trend_delta_pct or 0) >= 20 else "medium")
        session.add(
            UserAlert(
                user_id=manager.user_id,
                alert_type="manager_insight",
                title=title,
                message=message,
                priority=priority,
                is_read=random.choice([True, False]),
                created_at=fake.date_time_between(start_date="-7d", end_date="now"),
            )
        )
        created += 1

        # 2) Top performer shoutout
        if top_member is not None:
            session.add(
                UserAlert(
                    user_id=manager.user_id,
                    alert_type="team_leaderboard",
                    title=f"Top performer: {top_member.first_name} {top_member.last_name}",
                    message=(
                        f"{top_member.points} pts • Credit {int(top_member.credit)}. "
                        f"Consider a spotlight or reward."
                    ),
                    priority="medium",
                    is_read=random.choice([True, False]),
                    created_at=fake.date_time_between(start_date="-10d", end_date="now"),
                )
            )
            created += 1

        # 3) Pipeline risk alert
        team_size = len(active_team) or 1
        risk_ratio = (stale_login_count + no_tx_last30) / team_size
        if risk_ratio >= 0.3:  # 30% of team is stale
            session.add(
                UserAlert(
                    user_id=manager.user_id,
                    alert_type="team_pipeline_risk",
                    title="Pipeline at risk",
                    message=(
                        f"{stale_login_count} inactive logins (>=14d) and {no_tx_last30} reps without completed tx in 30d. "
                        f"Book follow-ups and coaching sessions."
                    ),
                    priority="high",
                    is_read=random.choice([True, False]),
                    created_at=fake.date_time_between(start_date="-14d", end_date="now"),
                )
            )
            created += 1

        # 4) Rewards opportunity
        if rewards_ready > 0:
            session.add(
                UserAlert(
                    user_id=manager.user_id,
                    alert_type="team_rewards",
                    title="Team rewards opportunity",
                    message=(
                        f"{rewards_ready} team member(s) can redeem a reward now. "
                        f"Recognition can boost momentum this week."
                    ),
                    priority="low",
                    is_read=random.choice([True, False]),
                    created_at=fake.date_time_between(start_date="-5d", end_date="now"),
                )
            )
            created += 1

    session.commit()
    print(f"Created {created} manager alerts.")


def seed_trainings(session: Session):
    skill_matches = {
        0: ["Customer Communication", "Problem Solving", "Objection Handling"],
        1: ["Negotiation", "Closing Deals"],
        2: ["Customer Communication", "After Sales Support"],
        3: ["Closing Deals", "Upselling", "Cross-selling"],
        4: ["Problem Solving", "Objection Handling", "Customer Retention"],
        5: ["Customer Retention", "Product Knowledge"],
        6: ["Customer Communication", "Product Knowledge"],
        7: ["Negotiation", "Problem Solving"],
        8: ["Solution Selling", "Problem Solving"],
        9: ["Customer Communication", "Closing Deals"],
        10: ["Vehicle Financing Basics"],
        11: ["CRM Usage"],
        12: ["Lead Management"],
        13: ["Time Management"],
        14: ["Service Package Knowledge"],
    }

    session.exec(delete(TrainingSkillLink))
    session.exec(delete(Training))
    session.exec(delete(Skill))

    all_training_skills = {
        skill
        for matched_skills in skill_matches.values()
        for skill in matched_skills
    }
    for skill in sorted(set(SKILLS) | all_training_skills):
        session.add(Skill(name=skill))

    trainings = [
        Training(
            title="The Language of Sales by SC Training (formerly EdApp)",
            description="building customer relationships & cultivating trust, building convincing arguments, navigating tough situations/scenarios.",
            url="https://safetyculture.com/library/professional-services/the-language-of-sales/",
            level="beginner"
        ),
        Training(
            title="Negotiation Fundamentals by SC Training (formerly EdApp)",
            description="the importance of negotiation, how to develop negotiation skills, influencing authority, the art of getting what you want, and how to negotiate with confidence.",
            url="https://safetyculture.com/library/professional-services/negotiation/",
            level="advanced"
        ),
        Training(
            title="Creating a Positive Customer Experience by SC Training (formerly EdApp)",
            description=" Role of customer service in customer experience, impressing customers, how to make good conversations with customers, how to engage customers, and how to handle difficult customers.",
            url="https://safetyculture.com/library/retail/creating-a-positive-customer-experience/",
            level="intermediate"
        ),
        Training(
            title="Closing a Deal by SC Training (formerly EdApp)",
            description=" modern sales strategies, relationships with stakeholders, closing deals during/after COVID-19.",
            url="https://safetyculture.com/library/professional-services/closing-a-deal/",
            level="beginner"
        ),
        Training(
            title="Dealing with Difficult Customers by SC Training (formerly EdApp)",
            description="types of difficult customers, how to respond to guest complaints, how to handle errors in deals, dealing with intoxicated customers, and how to manage stress from difficult customers.",
            url="https://safetyculture.com/library/hospitality/dealing-with-difficult-customers/",
            level="intermediate"
        ),
        Training(
            title="Building a Customer-Focused Culture by SC Training (formerly EdApp)",
            description="What customer focus means, understanding buying habits, delivering customers through customer-focused behavior, and how to build a customer-focused culture.",
            url="https://safetyculture.com/library/hospitality/building-a-customer-focused-culture/",
            level="beginner"
        ),
        Training(
            title="Active Listening by SC Training (formerly EdApp)",
            description=" active listening in sales, principles of active listening, nonverbal communication, barriers to active learning",
            url="https://safetyculture.com/library/professional-services/active-listening/",
            level="intermediate"
        ),
        Training(
            title="Advanced Negotiation by SC Training (formerly EdApp)",
            description="stages of negotiation, sequencing strategies and tactics, dealmaking, building coalitions, information sharing at the bargaining table",
            url="https://safetyculture.com/library/professional-services/advanced-negotiation/",
            level="advanced"
        ),
        Training(
            title="Solution Selling Strategy by SC Training (formerly EdApp)",
            description="Solution selling 101, risk and opportunity for solution selling, creative problem solving, solution selling action plans",
            url="https://safetyculture.com/library/professional-services/solution-selling-strategy/",
            level="beginner"
        ),
        Training(
            title="Selling Strategies and Interacting with Customers by SC Training (formerly EdApp)",
            description="greeting customers, selling by asking questions, using curiosity to sell, value-based selling, sale closing techniques",
            url="https://safetyculture.com/library/retail/selling-strategies-and-interacting-with-customers/",
            level="beginner"
        ),
        Training(
            title="Automotive Sales Advisor Training by Elevify",
            description="automotive sales process, pricing and financing basics, objection handling, CRM follow-up, and customer loyalty.",
            url="https://www.elevify.com/en-na/courses/business-and-economics/sales/automotive-sales-advisor-training-f45d9",
            level="beginner"
        ),
        Training(
            title="Salesforce for the Sales Force by SC Training (formerly EdApp)",
            description="CRM basics for sales teams, including Salesforce navigation and using customer records to support the sales process.",
            url="https://safetyculture.com/library/information-technology/salesforce-for-the-sales-force/",
            level="beginner"
        ),
        Training(
            title="Introduction to Lead Management by HubSpot Academy",
            description="lead management fundamentals, lead lifecycle stages, qualification, nurturing, and conversion basics.",
            url="https://academy.hubspot.com/lessons/introduction-lead-management",
            level="beginner"
        ),
        Training(
            title="Sales Professionals' Guide to Time Management by SC Training (formerly EdApp)",
            description="time management for sales professionals, process setup, prioritization, and efficient customer communication.",
            url="https://safetyculture.com/library/professional-services/sales-professionals-guide-to-time-management/",
            level="beginner"
        ),
        Training(
            title="Product Training with SafetyCulture",
            description="practical product training guidance for making sure teams understand service details, packages, and product knowledge.",
            url="https://safetyculture.com/training",
            level="beginner"
        ),
    ]
    session.add_all(trainings)
    session.flush()

    for idx, training in enumerate(trainings):
        for skill in skill_matches.get(idx, []):
            link = TrainingSkillLink(training_id=training.id, skill_name=skill)
            session.add(link)
    session.commit()

def main():
    import traceback
    print("Creating tables...")
    create_db_and_tables()

    try:
        with Session(engine) as session:
            print("Clearing old data...")
            clear_data(session)

            print("Creating dealerships...")
            dealerships = create_dealerships(session)

            print("Creating departments...")
            departments = create_departments(session, dealerships)

            print("Creating products...")
            products = create_products(session)

            print("Creating users...")
            users = create_users(session, dealerships, departments)

            print("Creating user skills...")
            create_user_skills(session, users)

            print("Creating rewards...")
            rewards = create_rewards(session)

            print("Creating transactions and transaction items...")
            transactions = create_transactions(session, users, products)

            print("Adding recent forecast support transactions...")
            transactions.extend(
                create_forecast_support_transactions(session, users, products)
            )

            print("Updating user points, rank and credit from completed transactions...")
            update_user_points_and_credit_from_transactions(session, users, transactions)

            print("Creating reward redemptions...")
            create_reward_redemptions(session, users, rewards)

            print("Creating manager alerts...")
            create_manager_alerts(session, users, rewards, transactions)

            # Create alerts last, so messages can reference up-to-date points/credit
            print("Creating alerts...")
            create_alerts(session, users, products, rewards, transactions)

            print("Creating trainings...")
            seed_trainings(session)

            print("Seed completed successfully.")
    except Exception as e:
        print("\n--- ERROR IN SEED ---")
        print(str(e))
        traceback.print_exc()


if __name__ == "__main__":
    main()
