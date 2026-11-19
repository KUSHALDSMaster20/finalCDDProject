pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    triggers {
        pollSCM('H/5 * * * *')
    }

    parameters {
        booleanParam(name: 'DEPLOY_TO_COMPOSE', defaultValue: false, description: 'Deploy the main branch to Docker Compose on this Jenkins agent.')
    }

    environment {
        DOCKER_BUILDKIT = '1'
        DB_NAME = 'campus_tracker'
        CORS_ORIGIN = 'http://localhost:3000'
    }

    stages {
        stage('Build Java API image') {
            steps {
                script {
                    if (isUnix()) sh 'docker compose build backend'
                    else bat 'docker compose build backend'
                }
            }
        }

        stage('Build React frontend image') {
            steps {
                script {
                    if (isUnix()) sh 'docker compose build frontend'
                    else bat 'docker compose build frontend'
                }
            }
        }

        stage('Deploy to Docker Compose') {
            when {
                allOf {
                    branch 'main'
                    expression { return params.DEPLOY_TO_COMPOSE }
                }
            }
            steps {
                withCredentials([
                    usernamePassword(credentialsId: 'campus-db', usernameVariable: 'DB_USER', passwordVariable: 'DB_PASSWORD'),
                    string(credentialsId: 'campus-jwt-secret', variable: 'JWT_SECRET'),
                    string(credentialsId: 'google-translate-api-key', variable: 'GOOGLE_TRANSLATE_API_KEY'),
                    string(credentialsId: 'openai-api-key', variable: 'OPENAI_API_KEY')
                ]) {
                    script {
                        if (isUnix()) sh 'docker compose up -d --build'
                        else bat 'docker compose up -d --build'
                    }
                }
            }
        }
    }

    post {
        success { echo 'Campus Commons pipeline completed successfully.' }
        failure { echo 'Pipeline failed. Review the stage logs before retrying deployment.' }
    }
}
