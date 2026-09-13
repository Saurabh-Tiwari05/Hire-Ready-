// LearningResourceService - recommends personalized learning resources
class LearningResourceService {
  // Curated resource catalog
  static RESOURCE_CATALOG = [
    {
      name: 'LeetCode',
      url: 'https://leetcode.com/',
      type: 'platform',
      tags: ['algorithms', 'data-structures', 'coding', 'sql'],
      description: 'Coding interview practice platform',
    },
    {
      name: 'HackerRank',
      url: 'https://www.hackerrank.com/',
      type: 'platform',
      tags: ['algorithms', 'data-structures', 'sql', 'system-design'],
      description: 'Programming challenges',
    },
    {
      name: 'GeeksforGeeks',
      url: 'https://www.geeksforgeeks.org/',
      type: 'article',
      tags: ['data-structures', 'algorithms', 'system-design', 'sql'],
      description: 'Technical tutorials and explanations',
    },
    {
      name: 'MDN Web Docs',
      url: 'https://developer.mozilla.org/',
      type: 'documentation',
      tags: ['javascript', 'react', 'html', 'css'],
      description: 'Web development documentation',
    },
    {
      name: 'Node.js Docs',
      url: 'https://nodejs.org/docs/',
      type: 'documentation',
      tags: ['node.js', 'backend', 'javascript'],
      description: 'Official Node.js documentation',
    },
    {
      name: 'PostgreSQL Documentation',
      url: 'https://www.postgresql.org/docs/',
      type: 'documentation',
      tags: ['sql', 'postgresql', 'database'],
      description: 'Official PostgreSQL documentation',
    },
    {
      name: 'Docker Documentation',
      url: 'https://docs.docker.com/',
      type: 'documentation',
      tags: ['docker', 'devops', 'containers'],
      description: 'Container platform documentation',
    },
    {
      name: 'Kubernetes Documentation',
      url: 'https://kubernetes.io/docs/',
      type: 'documentation',
      tags: ['kubernetes', 'devops', 'orchestration'],
      description: 'Container orchestration documentation',
    },
    {
      name: 'AWS Training',
      url: 'https://aws.amazon.com/training/',
      type: 'course',
      tags: ['aws', 'cloud', 'devops'],
      description: 'Cloud computing training',
    },
    {
      name: 'System Design Primer',
      url: 'https://github.com/donnemartin/system-design-primer',
      type: 'repository',
      tags: ['system-design', 'scalability', 'architecture'],
      description: 'Open-source system design preparation',
    },
    {
      name: 'Grokking the System Design Interview',
      url: 'https://www.educative.io/courses/grokking-the-system-design-interview',
      type: 'course',
      tags: ['system-design', 'architecture', 'scalability'],
      description: 'System design interview course',
    },
    {
      name: 'The React Developer Course',
      url: 'https://www.udemy.com/course/the-react-developer-course-2/',
      type: 'course',
      tags: ['react', 'frontend', 'javascript'],
      description: 'Complete React development course',
    },
    {
      name: 'PostgreSQL Bootcamp',
      url: 'https://www.udemy.com/course/postgresql-from-zero-to-hero/',
      type: 'course',
      tags: ['sql', 'postgresql', 'database'],
      description: 'PostgreSQL from beginner to expert',
    },
    {
      name: 'Design Patterns in JavaScript',
      url: 'https://www.udemy.com/course/design-patterns-javascript/',
      type: 'course',
      tags: ['javascript', 'design-patterns', 'architecture'],
      description: 'Learn software design patterns',
    },
    {
      name: 'Clean Code',
      url: 'https://www.udemy.com/course/clean-code/',
      type: 'book',
      tags: ['programming', 'code-quality', 'best-practices'],
      description: 'Book on writing clean, maintainable code',
    },
    {
      name: 'Cracking the Coding Interview',
      url: 'https://www.amazon.com/Cracking-Coding-Interview-Programming-Questions/dp/0984009856',
      type: 'book',
      tags: ['algorithms', 'interview', 'coding'],
      description: 'Classic coding interview book',
    },
  ];

  /**
   * Recommend learning resources based on skills
   */
  async recommendResources(skills, skillGaps = [], preferredTypes = null) {
    const allSkills = [...skills, ...skillGaps];
    const resources = [];

    for (const skill of allSkills) {
      const matches = this.RESOURCE_CATALOG.filter(resource => {
        const tagMatch = resource.tags.some(tag => tag.toLowerCase().includes(skill.toLowerCase()));
        const typeMatch = !preferredTypes || preferredTypes.includes(resource.type);
        return tagMatch && typeMatch;
      });

      matches.forEach(match => {
        if (!resources.find(r => r.name === match.name)) {
          const priority = skillGaps.includes(skill) ? 'high' : 'medium';
          resources.push({
            name: match.name,
            url: match.url,
            type: match.type,
            description: match.description,
            priority,
            relatedSkills: match.tags,
            source: 'catalog',
          });
        }
      });
    }

    // Sort by priority (high first) then by name
    return resources.sort((a, b) => {
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (b.priority === 'high' && a.priority !== 'high') return 1;
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Get resources for specific skills
   */
  getResourcesBySkill(skill) {
    return this.RESOURCE_CATALOG.filter(resource =>
      resource.tags.some(tag => tag.toLowerCase() === skill.toLowerCase())
    );
  }

  /**
   * Get all available resource types
   */
  getResourceTypes() {
    return ['article', 'video', 'course', 'book', 'platform', 'documentation', 'repository'];
  }
}

module.exports = new LearningResourceService();