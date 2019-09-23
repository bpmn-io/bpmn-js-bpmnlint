#!/usr/bin/env groovy

def cleanup_workspace() {
  cleanWs()
  dir("${env.WORKSPACE}@tmp") {
    deleteDir()
  }
  dir("${env.WORKSPACE}@script") {
    deleteDir()
  }
  dir("${env.WORKSPACE}@script@tmp") {
    deleteDir()
  }
}

def buildIsRequired = true

pipeline {
  agent any
  options {
    buildDiscarder(logRotator(numToKeepStr: '20', artifactNumToKeepStr: '20'))
  }
  tools {
    nodejs "node-lts"
  }
  environment {
    NPM_RC_FILE = 'process-engine-ci-token'
    NODE_JS_VERSION = 'node-lts'
  }

  stages {
    stage('Check if build is required') {
      steps {
        script {
          // Taken from https://stackoverflow.com/questions/37755586/how-do-you-pull-git-committer-information-for-jenkins-pipeline
          sh 'git --no-pager show -s --format=\'%an\' > commit-author.txt'
          def commitAuthorName = readFile('commit-author.txt').trim()

          def ciUserName = "admin"

          echo(commitAuthorName)
          echo("Commiter is process-engine-ci: ${commitAuthorName == ciUserName}")

          buildIsRequired = commitAuthorName != ciUserName

          if (!buildIsRequired) {
            echo("Commit was made by process-engine-ci. Skipping build.")
          }
        }
      }
    }
    stage('Install dependencies') {
      when {
        expression {buildIsRequired == true}
      }
      steps {
        nodejs(configId: env.NPM_RC_FILE, nodeJSInstallationName: env.NODE_JS_VERSION) {
          sh('node --version')
          sh('npm install --ignore-scripts')
        }
      }
    }
    stage('Build Sources') {
      when {
        expression {buildIsRequired == true}
      }
      steps {
        sh('node --version')
        sh('npm run build')
      }
    }
    stage('Test') {
      when {
        expression {buildIsRequired == true}
      }
      parallel {
        stage('Lint sources') {
          steps {
            sh('node --version')
            sh('npm run lint')
          }
        }
        stage('Execute tests') {
          steps {
            sh('node --version')
            sh('npm run test')
          }
        }
      }
    }
    stage('Set package version') {
      when {
        expression {buildIsRequired == true}
      }
      steps {
        sh('node --version')
        sh('node ./node_modules/.bin/ci_tools prepare-version --allow-dirty-workdir');
      }
    }
    stage('Publish') {
      when {
        expression {buildIsRequired == true}
      }
      parallel {
        stage('npm') {
          steps {
            nodejs(configId: env.NPM_RC_FILE, nodeJSInstallationName: env.NODE_JS_VERSION) {
              sh('node ./node_modules/.bin/ci_tools publish-npm-package --create-tag-from-branch-name')
            }
          }
        }
        stage('GitHub') {
          when {
            anyOf {
              branch "beta"
              branch "develop"
              branch "master"
            }
          }
          steps {
            withCredentials([
              usernamePassword(credentialsId: 'process-engine-ci_github-token', passwordVariable: 'GH_TOKEN', usernameVariable: 'GH_USER')
            ]) {
              sh('node ./node_modules/.bin/ci_tools commit-and-tag-version --only-on-primary-branches')
              sh('node ./node_modules/.bin/ci_tools update-github-release --only-on-primary-branches --use-title-and-text-from-git-tag');
            }
          }
        }
      }
    }
    stage('Cleanup') {
      when {
        expression {buildIsRequired == true}
      }
      steps {
        script {
          // this stage just exists, so the cleanup-work that happens in the post-script
          // will show up in its own stage in Blue Ocean
          sh(script: ':', returnStdout: true);
        }
      }
    }
  }
  post {
    always {
      script {
        cleanup_workspace();
      }
    }
  }
}
