FROM gcc:13-slim

# Add a non-root user sandbox (UID 1000)
RUN useradd -m -u 1000 sandbox

# Set the working directory
WORKDIR /sandbox

# Ensure the sandbox user owns the working directory
RUN chown -R sandbox:sandbox /sandbox

# Switch to the non-root user
USER sandbox
