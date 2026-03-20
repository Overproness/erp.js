const express = require('express');
const { execFile } = require('child_process');
const app = express();
const port = 3000;

app.use(express.json());

app.post('/n8n-instance', (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Missing "id" in request body.' });
  }

  console.log(`Received request to create instance for ID: ${id}`);

  // Execute our deployment script, passing the ID as an argument.
  // execFile is safer than exec as it prevents command injection.
  execFile('/app/scripts/launch_n8n.sh', [id], (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing script: ${error.message}`);
      console.error(`stderr: ${stderr}`);
      return res.status(500).json({
        message: 'Failed to launch n8n instance.',
        error: stderr
      });
    }

    console.log(`Script output: ${stdout}`);
    res.status(202).json({
      message: 'n8n instance creation process started.',
      details: stdout
    });
  });
});

app.listen(port, () => {
  console.log(`API Controller listening on port ${port}`);
});