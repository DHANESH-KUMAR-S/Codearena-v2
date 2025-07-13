#!/bin/bash

# Install required compilers and tools for code execution
echo "Installing build tools..."

# Update package list
apt-get update

# Install Python, Java, and C++ compilers
apt-get install -y \
    python3 \
    python3-pip \
    openjdk-17-jdk \
    g++ \
    build-essential

# Verify installations
echo "Python version:"
python3 --version

echo "Java version:"
java --version

echo "G++ version:"
g++ --version

echo "Build tools installation complete!" 