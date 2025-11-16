# Contributing to Authentication Module

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL, MySQL, or MongoDB (for database testing)
- Git

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/yourusername/auth-module.git
   cd auth-module
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

5. Set up environment:
   ```bash
   cp packages/auth-backend/.env.example packages/auth-backend/.env
   # Edit .env with your local configuration
   ```

## Development Workflow

### Running Locally

```bash
# Start backend in development mode
npm run dev:backend

# Start frontend in development mode (if testing integration)
npm run dev:frontend

# Run tests
npm test

# Run linter
npm run lint

# Format code
npm run format
```

### Making Changes

1. **Create a feature branch** from `main`
2. **Make your changes** following our code style
3. **Add tests** for new functionality
4. **Run tests** to ensure nothing breaks
5. **Lint and format** your code
6. **Commit your changes** with clear messages
7. **Push to your fork** and create a pull request

## Code Style

### JavaScript

- Use ES6+ features
- Use descriptive variable names
- Add JSDoc comments for all functions
- Follow ESLint rules
- Format with Prettier

### Example

```javascript
/**
 * Authenticates a user with email and password
 * @param {string} email - User email address
 * @param {string} password - User password
 * @returns {Promise<Object>} User object and tokens
 * @throws {AuthenticationError} If credentials are invalid
 */
export async function login(email, password) {
  // Implementation
}
```

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(backend): add phone authentication support
fix(frontend): resolve login form validation issue
docs(api): update endpoint documentation
test(services): add tests for auth service
```

## Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new features
3. **Ensure all tests pass**
4. **Update CHANGELOG.md** (if applicable)
5. **Request review** from maintainers
6. **Address feedback** promptly

### PR Title

Use the same format as commit messages:

```
feat(backend): add OAuth integration
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How has this been tested?

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Commented complex code
- [ ] Updated documentation
- [ ] Added tests
- [ ] All tests pass
- [ ] No new warnings
```

## Testing

### Writing Tests

- Write tests for all new features
- Maintain or improve code coverage
- Use descriptive test names
- Test edge cases

### Running Tests

```bash
# All tests
npm test

# Specific package
npm test --workspace=packages/auth-backend

# With coverage
npx c8 npm test
```

## Documentation

### What to Document

- All public APIs
- Configuration options
- Complex logic
- Breaking changes
- Migration guides

### Where to Document

- **JSDoc**: In-code documentation
- **README.md**: Package-level docs
- **docs/**: Detailed guides
- **examples/**: Usage examples

## Code Review

### As a Reviewer

- Be respectful and constructive
- Ask questions, don't demand
- Suggest improvements
- Approve when satisfied

### As an Author

- Respond to all comments
- Make requested changes or explain why not
- Keep PRs focused and small
- Be patient and professional

## Reporting Bugs

### Before Reporting

1. Check existing issues
2. Try latest version
3. Verify it's reproducible

### Bug Report Template

```markdown
**Description**
Clear description of the bug

**To Reproduce**
Steps to reproduce:
1.
2.
3.

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- OS: [e.g., Ubuntu 22.04]
- Node.js: [e.g., 20.10.0]
- Package Version: [e.g., 1.0.0]

**Additional Context**
Any other relevant information
```

## Feature Requests

### Feature Request Template

```markdown
**Problem**
What problem does this solve?

**Proposed Solution**
How should it work?

**Alternatives**
Other solutions considered

**Additional Context**
Any other relevant information
```

## Release Process

(For maintainers)

1. Update version in package.json
2. Update CHANGELOG.md
3. Create git tag
4. Push to GitHub
5. Create GitHub release
6. Publish to npm

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism
- Focus on what's best for the community
- Show empathy

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Personal or political attacks
- Publishing others' private information
- Other unprofessional conduct

## Questions?

- Open a GitHub issue
- Join our discussions
- Email: support@example.com

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Thank You!

Your contributions make this project better. We appreciate your time and effort!
