# backend/src/socketio.py

from flask_socketio import SocketIO, emit, join_room, leave_room

socketio = SocketIO(cors_allowed_origins="*")

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('join')
def handle_join(data):
    room = data.get('room')
    join_room(room)
    emit('status', {'msg': f'Joined room {room}'}, room=room)

@socketio.on('leave')
def handle_leave(data):
    room = data.get('room')
    leave_room(room)
    emit('status', {'msg': f'Left room {room}'}, room=room)

@socketio.on('send_message')
def handle_send_message(data):
    room = data.get('room')
    emit('receive_message', data, room=room)