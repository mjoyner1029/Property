from src.app import create_app

app = create_app()

print('Registered Property Routes:')
for rule in app.url_map.iter_rules():
    if 'property' in rule.endpoint:
        print(f"{rule} - {rule.endpoint} - Methods: {rule.methods}")
