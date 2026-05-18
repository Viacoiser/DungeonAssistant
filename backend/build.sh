#!/bin/bash
# Build script para Vercel - Backend (Production)

echo "📦 Installing production dependencies..."
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt --no-cache-dir

echo "✅ Backend production dependencies installed successfully"
