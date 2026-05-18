#!/bin/bash
# Build script para Vercel - Backend

echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "✅ Backend dependencies installed successfully"
