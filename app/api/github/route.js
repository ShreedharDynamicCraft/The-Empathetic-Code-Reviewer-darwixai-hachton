export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { owner, repo } = await req.json();

    if (!owner || !repo) {
      return new Response(
        JSON.stringify({ error: "Owner and repo are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch repository information
    const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (!repoResponse.ok) {
      if (repoResponse.status === 404) {
        return new Response(
          JSON.stringify({ error: "Repository not found or not public" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Failed to fetch repository: ${repoResponse.statusText}`);
    }

    const repoData = await repoResponse.json();
    if (repoData.private) {
      return new Response(
        JSON.stringify({ error: "Repository is private. Only public repositories are supported." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch repository tree to get all files
    const treeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${repoData.default_branch}?recursive=1`);
    if (!treeResponse.ok) {
      throw new Error(`Failed to fetch repository tree: ${treeResponse.statusText}`);
    }

    const treeData = await treeResponse.json();
    
    // Filter for code files only
    const codeExtensions = [
      '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.hpp',
      '.cs', '.php', '.rb', '.go', '.rs', '.kt', '.swift', '.m', '.mm',
      '.scala', '.clj', '.sh', '.bash', '.ps1', '.sql', '.r', '.dart',
      '.vue', '.svelte', '.astro'
    ];

    const codeFiles = treeData.tree
      .filter(item => 
        item.type === 'blob' && 
        codeExtensions.some(ext => item.path.endsWith(ext)) &&
        item.size < 100000 // Skip very large files (>100KB)
      )
      .map(item => ({
        path: item.path,
        url: item.url,
        size: item.size,
        language: getLanguageFromExtension(item.path)
      }))
      .slice(0, 50); // Limit to first 50 files

    return new Response(
      JSON.stringify({
        repository: {
          name: repoData.name,
          full_name: repoData.full_name,
          description: repoData.description,
          language: repoData.language,
          stars: repoData.stargazers_count,
          forks: repoData.forks_count
        },
        files: codeFiles
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("GitHub API error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to fetch repository" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

function getLanguageFromExtension(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const languageMap = {
    'js': 'JavaScript',
    'jsx': 'JavaScript',
    'ts': 'TypeScript',
    'tsx': 'TypeScript',
    'py': 'Python',
    'java': 'Java',
    'cpp': 'C++',
    'c': 'C',
    'h': 'C',
    'hpp': 'C++',
    'cs': 'C#',
    'php': 'PHP',
    'rb': 'Ruby',
    'go': 'Go',
    'rs': 'Rust',
    'kt': 'Kotlin',
    'swift': 'Swift',
    'm': 'Objective-C',
    'mm': 'Objective-C++',
    'scala': 'Scala',
    'clj': 'Clojure',
    'sh': 'Shell',
    'bash': 'Shell',
    'ps1': 'PowerShell',
    'sql': 'SQL',
    'r': 'R',
    'dart': 'Dart',
    'vue': 'Vue',
    'svelte': 'Svelte',
    'astro': 'Astro'
  };
  return languageMap[ext] || 'Unknown';
}
