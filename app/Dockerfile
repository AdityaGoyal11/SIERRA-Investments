FROM node:18-slim

# Install Python and required packages
RUN apt-get update && \
    apt-get install -y python3-minimal python3-pip python3-venv && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create and activate virtual environment
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install Python packages in virtual environment
RUN pip3 install --no-cache-dir pandas python-dateutil pytz

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install
RUN npm install bcryptjs jsonwebtoken

# Copy app source
COPY . .

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 