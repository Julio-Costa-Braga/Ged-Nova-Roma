const { deleteSampleColaboradores } = require('../services/rhService');

async function run() {
  try {
    const result = await deleteSampleColaboradores();
    console.log('deleteSampleColaboradores result:', result);
    process.exit(0);
  } catch (err) {
    console.error('Error deleting sample colaboradores:', err.message || err);
    process.exit(1);
  }
}

run();
