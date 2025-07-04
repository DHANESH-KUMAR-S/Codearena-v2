FROM openjdk:17-slim
WORKDIR /code
COPY Main.java .
COPY Main.java.input .
RUN javac Main.java
CMD ["sh", "-c", "java Main < Main.java.input"]
