using Microsoft.AspNetCore.Mvc;
using BudgetingBE.Domain.Entities;
using BudgetingBE.Domain.Repositories;

namespace BudgetingBE.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TodosController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;

    public TodosController(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Todo>>> GetAll(CancellationToken cancellationToken)
    {
        var todos = await _unitOfWork.Todos.GetAllAsync(cancellationToken);
        return Ok(todos);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Todo>> GetById(int id, CancellationToken cancellationToken)
    {
        var todo = await _unitOfWork.Todos.GetByIdAsync(id, cancellationToken);
        if (todo is null) return NotFound();
        return Ok(todo);
    }

    [HttpPost]
    public async Task<ActionResult<Todo>> Create(Todo todo, CancellationToken cancellationToken)
    {
        todo.CreatedAt = DateTime.UtcNow;
        await _unitOfWork.Todos.AddAsync(todo, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = todo.Id }, todo);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, Todo input, CancellationToken cancellationToken)
    {
        var todo = await _unitOfWork.Todos.GetByIdAsync(id, cancellationToken);
        if (todo is null) return NotFound();

        todo.Title = input.Title;
        todo.IsCompleted = input.IsCompleted;
        _unitOfWork.Todos.Update(todo);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var todo = await _unitOfWork.Todos.GetByIdAsync(id, cancellationToken);
        if (todo is null) return NotFound();

        _unitOfWork.Todos.Delete(todo);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}
