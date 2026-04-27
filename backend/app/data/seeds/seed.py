import random
from faker import Faker
from sqlmodel import Session, delete

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

ALERT_TYPES = ["performance", "reward", "system", "sales"]
ALERT_PRIORITIES = ["low", "medium", "high"]

ALERT_TITLES = [
    "New reward available",
    "Monthly target reached",
    "New sales opportunity",
    "Performance update",
    "Customer follow-up reminder",
    "New service package available",
    "Reward redemption update",
]

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


def create_alerts(session: Session, users):
    for _ in range(TARGET_ALERTS):
        user = random.choice(users)

        alert = UserAlert(
            user_id=user.user_id,
            alert_type=random.choice(ALERT_TYPES),
            title=random.choice(ALERT_TITLES),
            message=fake.sentence(nb_words=12),
            priority=random.choice(ALERT_PRIORITIES),
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


def main():
    print("Creating tables...")
    create_db_and_tables()

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

        print("Creating alerts...")
        create_alerts(session, users)

        print("Creating rewards...")
        rewards = create_rewards(session)

        print("Creating transactions and transaction items...")
        transactions = create_transactions(session, users, products)

        print("Updating user points, rank and credit from completed transactions...")
        update_user_points_and_credit_from_transactions(session, users, transactions)

        print("Creating reward redemptions...")
        create_reward_redemptions(session, users, rewards)

        print("Seed completed successfully.")


if __name__ == "__main__":
    main()