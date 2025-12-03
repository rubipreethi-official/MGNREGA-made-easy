const { spawn } = require('child_process');
const path = require('path');

class ChartService {
  constructor() {
    this.pythonPath = process.env.PYTHON_PATH || 'python';
    this.scriptPath = path.join(__dirname, '..', 'scripts', 'chart_generator.py');
  }

  async generateChart(chartType, data) {
    return new Promise((resolve, reject) => {
      const inputData = JSON.stringify({ chartType, data });
      console.log(`🐍 Calling Python to generate ${chartType} chart...`);

      const python = spawn(this.pythonPath, [this.scriptPath, inputData], {
        timeout: 30000,  // 30 second timeout
        stdio: ['pipe', 'pipe', 'pipe']  // Ensure stderr is captured
      });
      
      let stdout = '';
      let stderr = '';
      let timedOut = false;

      const timeoutHandle = setTimeout(() => {
        timedOut = true;
        python.kill();
        reject(new Error(`Python script timeout (>30s) for ${chartType} chart generation`));
      }, 30000);

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
        // Log warnings but don't fail on them
        if (!stderr.includes('UserWarning') && !stderr.includes('DeprecationWarning')) {
          console.warn(`⚠️ Python stderr: ${data.toString()}`);
        }
      });

      python.on('close', (code) => {
        clearTimeout(timeoutHandle);
        
        if (timedOut) return;

        if (code !== 0) {
          console.error(`❌ Python script failed (exit code ${code}) for ${chartType} chart`);
          console.error(`stderr: ${stderr}`);
          console.error(`stdout: ${stdout}`);
          return reject(new Error(`Python script failed: ${stderr || 'Unknown error'}`));
        }

        try {
          // Try to parse the output
          if (!stdout.trim()) {
            return reject(new Error(`Python produced no output for ${chartType} chart`));
          }

          const result = JSON.parse(stdout);
          if (result.success) {
            console.log(`✅ ${chartType} chart generated successfully`);
            resolve(result.image);
          } else {
            console.error(`❌ Python returned error for ${chartType}: ${result.error}`);
            reject(new Error(result.error || `Failed to generate ${chartType} chart`));
          }
        } catch (parseError) {
          console.error(`❌ Failed to parse Python output for ${chartType}`);
          console.error(`stdout: ${stdout}`);
          console.error(`Parse error: ${parseError.message}`);
          reject(new Error(`Invalid Python output: ${parseError.message}`));
        }
      });

      python.on('error', (error) => {
        clearTimeout(timeoutHandle);
        console.error(`❌ Failed to start Python process: ${error.message}`);
        reject(new Error(`Failed to spawn Python: ${error.message}`));
      });
    });
  }

  async generateAllCharts(summary) {
    const charts = {};
    const chartConfigs = [
      {
        type: 'employment',
        data: {
          personsDemanded: summary.employment.personsDemanded,
          personsEmployed: summary.employment.personsEmployed
        }
      },
      {
        type: 'expenditure',
        data: {
          wages: summary.expenditure.wages,
          material: summary.expenditure.material,
          admin: summary.expenditure.admin
        }
      },
      {
        type: 'works',
        data: {
          total: summary.works.total,
          completed: summary.works.completed,
          inProgress: summary.works.inProgress
        }
      }
    ];

    // Generate charts sequentially with better error handling
    for (const config of chartConfigs) {
      try {
        const image = await this.generateChart(config.type, config.data);
        charts[config.type] = image;
      } catch (error) {
        console.error(`⚠️ Skipping ${config.type} chart due to error: ${error.message}`);
        // Continue with other charts even if one fails
      }
    }

    return charts;
  }
}

module.exports = new ChartService();