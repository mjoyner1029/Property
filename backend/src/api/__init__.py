from flask_restx import Api

from .auth_namespace import auth_ns

api = Api(
    title="Property Management API",
    version="1.0",
    description="A property management system API"
)

# Register namespaces
api.add_namespace(auth_ns, path='/auth')
