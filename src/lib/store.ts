import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  name: string;
  employeeId: string;
  descriptor: number[];
  registeredAt: string;
}

export interface AttendanceLog {
  id: string;
  userId: string;
  employeeId: string;
  name: string;
  timestamp: string;
}

export const getUsers = async (): Promise<User[]> => {
  try {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error('Failed to fetch users');
    const data = await res.json();
    console.log('✅ Fetched users:', data);
    return data;
  } catch (err) {
    console.error('❌ Error fetching users:', err);
    return [];
  }
};

export const saveUser = async (user: Omit<User, 'id' | 'registeredAt'>): Promise<User | null> => {
  try {
    const newUser = {
      ...user,
      id: uuidv4(),
    };
    console.log('💾 Saving user:', newUser.name);
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    });
    if (!res.ok) throw new Error('Failed to save user');
    const savedUser = await res.json();
    console.log('✅ User saved successfully');
    return savedUser;
  } catch (err) {
    console.error('❌ Error saving user:', err);
    return null;
  }
};

export const getLogs = async (): Promise<AttendanceLog[]> => {
  try {
    const res = await fetch('/api/logs');
    if (!res.ok) throw new Error('Failed to fetch logs');
    const data = await res.json();
    console.log('✅ Fetched logs:', data);
    return data;
  } catch (err) {
    console.error('❌ Error fetching logs:', err);
    return [];
  }
};

export const logAttendance = async (userId: string): Promise<AttendanceLog | null> => {
  try {
    const users = await getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return null;

    const newLog = {
      id: uuidv4(),
      userId: user.id,
      employeeId: user.employeeId,
      name: user.name,
    };

    const res = await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLog)
    });
    if (!res.ok) throw new Error('Failed to save log');
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
};

