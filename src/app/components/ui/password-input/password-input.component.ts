import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'password-input',
  templateUrl: './password-input.component.html',
  styleUrls: ['./password-input.component.less'],
  imports: [CommonModule, FormsModule],
  standalone: true,  
})
export class PasswordInputComponent implements OnInit {
  @Input() validationRegex = new RegExp('');
  @Input() placeholder = "סיסמה";
  @Input() isRequired = true;
  @Output() passwordChange = new EventEmitter<string>();

  password = '';
  showPassword = false;
  isValid = false;

  ngOnInit(): void {
      this.isValid = this.isPasswordValid(this.password);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onPasswordChange(): void {
    this.isValid = this.isPasswordValid(this.password);
    this.passwordChange.emit(this.password);
  }

  private isPasswordValid(password: string): boolean {
    if (!password) {
        return !this.isRequired;
    }

    return new RegExp(this.validationRegex).test(password);
  }
}
