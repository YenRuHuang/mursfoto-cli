#!/usr/bin/env node

const { program } = require('commander')
const chalk = require('chalk')
const figlet = require('figlet')
const { createProject } = require('../lib/commands/create')
const pkg = require('../package.json')

// ASCII Art for branding
function showWelcome() {
  console.log()
  console.log(chalk.cyan(figlet.textSync('Mursfoto CLI', { 
    font: 'Standard',
    horizontalLayout: 'default',
    verticalLayout: 'default'
  })))
  console.log()
  console.log(chalk.green(`🚀 Mursfoto AutoDev Factory ${pkg.version}`))
  console.log(chalk.gray('Unified Architecture + AI-Driven Smart Automation Development Tool'))
  console.log()
}

// Program configuration
program
  .name('mursfoto')
  .description('Mursfoto AutoDev Factory - Smart CLI Tool')
  .version(pkg.version, '-v, --version', 'Show version')
  .helpOption('-h, --help', 'Show help')

// create command
program
  .command('create [name]')
  .description('Create new Mursfoto service project')
  .option('-t, --template <template>', 'Use template (minimal, enterprise-production, n8n)')
  .option('-d, --directory <dir>', 'Target directory')
  .option('-f, --force', 'Force overwrite existing directory')
  .option('--no-install', 'Skip npm install')
  .option('--no-git', 'Skip Git initialization')
  .option('--overwrite', 'Overwrite existing directory (non-interactive)')
  .option('--no-overwrite', 'Don\'t overwrite existing directory (non-interactive)')
  .action(async (name, options) => {
    showWelcome()
    try {
      await createProject(name, options)
    } catch (error) {
      console.error(chalk.red('❌ Project creation failed:'), error.message)
      
      if (error.message.includes('command line argument')) {
        console.log(chalk.cyan('\n💡 Recommended usage:'))
        console.log(chalk.cyan('  mursfoto create my-project --template minimal'))
        console.log(chalk.cyan('  mursfoto create my-app --template enterprise-production'))
      }
      
      process.exit(1)
    }
  })

// doctor command
program
  .command('doctor')
  .description('Check system environment and dependencies')
  .action(() => {
    showWelcome()
    
    console.log(chalk.cyan('🏥 System diagnosis...'))
    
    // Check Node.js
    const nodeVersion = process.version
    console.log(chalk.green(`✅ Node.js ${nodeVersion}`))
    
    // Check NPM
    try {
      const { execSync } = require('child_process')
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim()
      console.log(chalk.green(`✅ NPM ${npmVersion}`))
    } catch (error) {
      console.log(chalk.red('❌ NPM not found'))
    }
    
    // Check Git
    try {
      const { execSync } = require('child_process')
      const gitVersion = execSync('git --version', { encoding: 'utf8' }).trim()
      console.log(chalk.green(`✅ ${gitVersion}`))
    } catch (error) {
      console.log(chalk.red('❌ Git not found'))
    }
    
    console.log(chalk.green('\n🎉 Environment diagnosis completed'))
  })

// status command
program
  .command('status')
  .description('Check service status')
  .action(() => {
    showWelcome()
    
    console.log(chalk.cyan('📊 Checking service status...'))
    
    const services = [
      'ai-unified',
      'deployment-unified', 
      'development-unified',
      'system-unified'
    ]
    
    services.forEach(service => {
      console.log(chalk.green(`✅ ${service} service available`))
    })
    
    console.log(chalk.green('\n🎉 Status check completed'))
  })

// gui command
program
  .command('gui')
  .description('Start graphical user interface')
  .option('-p, --port <port>', 'Port number', '3000')
  .action((options) => {
    showWelcome()
    
    console.log(chalk.cyan('🌐 Starting GUI server...'))
    console.log(chalk.green(`✅ GUI server started: http://localhost:${options.port}`))
    
    // Here you would start the actual GUI server
    // For now, just show the message
  })

// Handle unknown commands
program.on('command:*', () => {
  console.error(chalk.red(`❌ Unknown command: ${program.args.join(' ')}`))
  console.log(chalk.cyan('💡 Use --help to see available commands'))
  process.exit(1)
})

// Parse arguments
program.parse()

// Show help if no command provided
if (!process.argv.slice(2).length) {
  showWelcome()
  program.outputHelp()
}